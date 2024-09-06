function parseSchemFile(arrayBuffer, callback) {
    nbt.parse(arrayBuffer, function (error, root) {
        if (error) {
            throw error;
        }
        console.log(root)

        const version = parseVersion(root)
        switch (version) {
            case 2:
                moveOffsetV2(root);
                moveOriginV2(root);
                setMaterialsV2(root);
                moveTileEntitiesV2(root);
                convertBlockDataV2(root);
                break;
            case 3:
                setGlobalDataV3(root);
                moveOffsetV3(root);
                moveOriginV3(root);
                moveTileEntitiesV3(root);
                convertBlockDataV3(root);

                delete root.value.Schematic;
                break
            default:
                toastError(`Неизвестная версия схемы: ${version}`)
                throw `Unknown version number: ${version}`
        }

        console.log(root)
        zlib.gzip(new Uint8Array(nbt.writeUncompressed(root)), function (error, data) {
            if (error) {
                throw error;
            }

            console.log(root)
            callback(data);
        });
    });
}

// Парсит версию схематики
function parseVersion(nbtData) {
    let version;
    if (nbtData.value?.Version) {
        version = Number(nbtData.value?.Version?.value)
    }
    if (getSchematicObjectV3(nbtData)) {
        version = Number(getSchematicObjectV3(nbtData).Version?.value);
    }
    if(Number.isNaN(version)) {
        version = undefined;
        console.log(nbtData)
    }
    return version
}

// Конвертирует идентификатор блока в устаревший формат
function convertToLegacyBlockId(namespaceKey) {
    if (namespaceKey in blocksNamespace) {
        return blocksNamespace[namespaceKey];
    }

    // Not in the table, try to find a match
    var originalKey = namespaceKey;
    var index;

    if (~(index = namespaceKey.indexOf('shape='))) {
        namespaceKey = namespaceKey.substr(0, index) + 'shape=straight' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('smooth_stone_slab'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'stone_slab' + namespaceKey.substr(namespaceKey.indexOf('[', index));
    }

    if (~(index = namespaceKey.indexOf('_wall_sign'))) {
        namespaceKey = 'minecraft:wall_sign' + namespaceKey.substr(namespaceKey.indexOf('[', index));
    }

    if (!~namespaceKey.indexOf('wall_sign') && ~(index = namespaceKey.indexOf('_sign'))) {
        namespaceKey = 'minecraft:sign' + namespaceKey.substr(namespaceKey.indexOf('[', index));
    }

    if (~(index = namespaceKey.indexOf('_wall_banner'))) {
        namespaceKey = 'minecraft:white_wall_banner' + namespaceKey.substr(namespaceKey.indexOf('[', index));
    }

    if (!~namespaceKey.indexOf('wall_banner') && ~(index = namespaceKey.indexOf('_banner'))) {
        namespaceKey = 'minecraft:white_banner' + namespaceKey.substr(namespaceKey.indexOf('[', index));
    }

    if (~(index = namespaceKey.indexOf('_bed'))) {
        namespaceKey = 'minecraft:red_bed' + namespaceKey.substr(namespaceKey.indexOf('[', index));
    }

    if (~(index = namespaceKey.indexOf('_wall_head'))) {
        namespaceKey = 'minecraft:skeleton_wall_skull' + namespaceKey.substr(namespaceKey.indexOf('[', index));
    }

    if (!~(index = namespaceKey.indexOf('_wall_head')) && ~(index = namespaceKey.indexOf('_head'))) {
        namespaceKey = 'minecraft:skeleton_skull' + namespaceKey.substr(namespaceKey.indexOf('[', index));
    }

    if (~(index = namespaceKey.indexOf('east='))) {
        namespaceKey = namespaceKey.substr(0, index) + 'east=false' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('north='))) {
        namespaceKey = namespaceKey.substr(0, index) + 'north=false' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('south='))) {
        namespaceKey = namespaceKey.substr(0, index) + 'south=false' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('west='))) {
        namespaceKey = namespaceKey.substr(0, index) + 'west=false' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('distance='))) {
        namespaceKey = namespaceKey.substr(0, index) + 'distance=1' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('type=left')) || ~(index = namespaceKey.indexOf('type=right'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'type=single' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('waterlogged=true'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'waterlogged=false' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('note='))) {
        namespaceKey = namespaceKey.substr(0, index) + 'note=0' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('snowy=true'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'snowy=false' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (namespaceKey in blocksNamespace) {
        return blocksNamespace[namespaceKey];
    }

    if (~(index = namespaceKey.indexOf('up=false'))) {
        tempkey = namespaceKey.substr(0, index) + 'up=true' + namespaceKey.substr(namespaceKey.indexOf(',', index));

        if (tempkey in blocksNamespace) {
            return blocksNamespace[tempkey];
        }
    }

    if (~(index = namespaceKey.indexOf('up=true'))) {
        tempkey = namespaceKey.substr(0, index) + 'up=false' + namespaceKey.substr(namespaceKey.indexOf(',', index));

        if (tempkey in blocksNamespace) {
            return blocksNamespace[tempkey];
        }
    }

    if (~(index = namespaceKey.indexOf('axis=x')) || ~(index = namespaceKey.indexOf('axis=z'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'axis=y' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('east=false'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'east=none' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('north=false'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'north=none' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('south=false'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'south=none' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('west=false'))) {
        namespaceKey = namespaceKey.substr(0, index) + 'west=none' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (~(index = namespaceKey.indexOf('rotation='))) {
        namespaceKey = namespaceKey.substr(0, index) + 'rotation=0' + namespaceKey.substr(namespaceKey.indexOf(',', index));
    }

    if (namespaceKey in blocksNamespace) {
        return blocksNamespace[namespaceKey];
    }

    if (~(index = namespaceKey.indexOf('facing=')) && ~namespaceKey.indexOf('hinge=')) {
        tempkey = namespaceKey.substr(0, index) + 'facing=east' + namespaceKey.substr(namespaceKey.indexOf(',', index));

        if (~(index = tempkey.indexOf('open=true'))) {
            tempkey = tempkey.substr(0, index) + 'open=false' + tempkey.substr(namespaceKey.indexOf(',', index));
        }

        if (tempkey in blocksNamespace) {
            return blocksNamespace[tempkey];
        }

        index = namespaceKey.indexOf('hinge=');

        tempkey = namespaceKey.substr(0, index) + 'hinge=right' + namespaceKey.substr(namespaceKey.indexOf(',', index));

        if (tempkey in blocksNamespace) {
            return blocksNamespace[tempkey];
        }
    }

    if (~(index = namespaceKey.indexOf('facing=east'))) {
        tempkey = namespaceKey.substr(0, index) + 'facing=west' + namespaceKey.substr(namespaceKey.indexOf(',', index));

        if (tempkey in blocksNamespace) {
            return blocksNamespace[tempkey];
        }
    }

    if (~(index = namespaceKey.indexOf('facing='))) {
        tempkey = namespaceKey.substr(0, index) + 'facing=north' + namespaceKey.substr(namespaceKey.indexOf(',', index));

        if (tempkey in blocksNamespace) {
            return blocksNamespace[tempkey];
        }
    }

    if (~(index = namespaceKey.indexOf('half=upper'))) {
        tempkey = namespaceKey.substr(0, index) + 'half=lower' + namespaceKey.substr(namespaceKey.indexOf(',', index));

        if (tempkey in blocksNamespace) {
            return blocksNamespace[tempkey];
        }
    }

    if (~(index = originalKey.indexOf('powered=true'))) {
        tempkey = originalKey.substr(0, index) + 'powered=false' + originalKey.substr(originalKey.indexOf(',', index));

        return convertToLegacyBlockId(tempkey);
    }

    // How about no block states?
    if (~(index = originalKey.indexOf('['))) {
        tempkey = originalKey.substr(0, index);

        if (tempkey in blocksNamespace) {
            return blocksNamespace[tempkey];
        }
    }

    var error = 'Неизвестный блок: ' + originalKey + ', заменено на воздух.';

    if (document && document.querySelector) {
        var errorNode = document.querySelector('#error');

        if (errorNode && !~errorNode.innerHTML.indexOf(error)) {
            errorNode.innerHTML += error + '<br/>';
        }
    }

    console.log(error);
    return 0;
}