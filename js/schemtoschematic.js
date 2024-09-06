if (typeof nbt === 'undefined') {
    nbt = require('./plugins/nbt');
}

if (typeof zlib === 'undefined') {
    zlib = require('js/plugins/zlib');
}

function schemtoschematic(arrayBuffer, callback) {
    // Move the schematic offset data to the old location
    function moveOffset(root) {
        if ('Metadata' in root.value) {
            root.value.WEOffsetX = root.value.Metadata.value.WEOffsetX;
            root.value.WEOffsetY = root.value.Metadata.value.WEOffsetY;
            root.value.WEOffsetZ = root.value.Metadata.value.WEOffsetZ;

            delete root.value.Metadata;
        }
    }

    // Move the schematic origin data to the old location
    function moveOrigin(root) {
        if ('Offset' in root.value) {
            root.value.WEOriginX = {type: 'int', value: root.value.Offset.value[0]};
            root.value.WEOriginY = {type: 'int', value: root.value.Offset.value[1]};
            root.value.WEOriginZ = {type: 'int', value: root.value.Offset.value[2]};

            delete root.value.Offset;
        }
    }

    // Set the schematic materials type
    function setMaterials(root) {
        root.value.Materials = {type: 'string', value: 'Alpha'};
    }

    // Move the tile entites to the old location and modify their position and id data
    function moveTileEntities(root) {
        if ('BlockEntities' in root.value) {
            root.value.TileEntities = root.value.BlockEntities;
            delete root.value.BlockEntities;

            for (var i = 0; i < root.value.TileEntities.length; i++) {
                var tileEntity = root.value.TileEntities[i];

                if ('Pos' in tileEntity.value) {
                    tileEntity.value.x = {type: 'int', value: tileEntity.value.Pos.value[0]};
                    tileEntity.value.y = {type: 'int', value: tileEntity.value.Pos.value[1]};
                    tileEntity.value.z = {type: 'int', value: tileEntity.value.Pos.value[2]};

                    delete tileEntity.value.Pos;
                }

                if ('Id' in tileEntity.value) {
                    tileEntity.value.id = tileEntity.value.Id;

                    delete tileEntity.value.Id;
                }
            }
        }
    }

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

        var error = 'Unknown namespace key: ' + originalKey + ', replacing with air. ' + namespaceKey;

        if (document && document.querySelector) {
            var errorNode = document.querySelector('#error');

            if (errorNode && !~errorNode.innerHTML.indexOf(error)) {
                errorNode.innerHTML += error + '<br/>';
            }
        }

        console.log(error);
        return 0;
    }

    // Convert the block data to the legacy blocks and data
    function convertBlockData(root) {
        if ('Palette' in root.value && 'BlockData' in root.value) {
            var palette = [];

            for (var key in root.value.Palette.value) {
                palette[root.value.Palette.value[key].value] = key;
            }

            var blockdata = root.value.BlockData.value;
            var blocks = [];
            var data = [];
            var addBlocks = null;

            var varInt = 0;
            var varIntLength = 0;
            var blockId;
            for (var i = 0; i < blockdata.length; i++) {
                varInt |= (blockdata[i] & 127) << (varIntLength++ * 7);

                if ((blockdata[i] & 128) == 128) {
                    continue;
                }

                blockId = convertToLegacyBlockId(palette[varInt]);
                convertedID = (blockId >> 4);
                blocks.push(convertedID);
                metaID = (blockId & 0xF);
                data.push(metaID);

                if (convertedID > 255) { // Check if block ID is over 255
                    if (addBlocks == null) { // Lazily create section
                        addBlocks = new Array(((blocks.length) >> 1) + 1);
                    }
                    var index = blocks.length - 1;
                    addBlocks[index >> 1] = (index & 1) == 0 ?
                        (addBlocks[index >> 1] & 0xF0) | ((convertedID >> 8) & 0xF) :
                        (addBlocks[index >> 1] & 0xF) | (((convertedID >> 8) & 0xF) << 4);
                }

                varIntLength = 0;
                varInt = 0;
            }

            root.value.Blocks = {type: 'byteArray', value: blocks};
            root.value.Data = {type: 'byteArray', value: data};
            root.value.AddBlocks = {type: 'byteArray', value: addBlocks};
            delete root.value.BlockData;
        }
    }

    nbt.parse(arrayBuffer, function (error, root) {
        if (error) {
            throw error;
        }

        moveOffset(root);
        moveOrigin(root);
        setMaterials(root);
        moveTileEntities(root);
        convertBlockData(root);
        zlib.gzip(new Uint8Array(nbt.writeUncompressed(root)), function (error, data) {
            if (error) {
                throw error;
            }

            callback(data);
        });
    });
}

if (typeof module !== 'undefined') {
    module.exports = schemtoschematic;
}
