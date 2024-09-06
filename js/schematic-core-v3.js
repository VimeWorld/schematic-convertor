function moveGlobalDataV3(root) {
    const data = getSchematicObjectV3(root)
    root.name = 'Schematic'
    root.value.Width = data.Width;
    root.value.Length = data.Length;
    root.value.Height = data.Height;
    root.value.Materials = {type: 'string', value: 'Alpha'};
    root.value.Platform = {'type': 'string', 'value': 'bukkit'};

    root.value.Entities = {
        type: 'list', value: {
            value: [],
            type: 'compound'
        }
    };
}

// Перемещает данные смещения схемы на старое место
function moveOffsetV3(root) {
    const data = getSchematicObjectV3(root)
    try {
        const [x, y, z] = data.Offset.value
        root.value.WEOffsetX = {type: 'int', value: x};
        root.value.WEOffsetY = {type: 'int', value: y};
        root.value.WEOffsetZ = {type: 'int', value: z};

        delete root.value.Schematic.value.Offset;
    } catch (e) {
        console.error(e)
        toastError(`moveOffsetV3 error`)
    }
}

// Перемещает данные происхождения схемы на старое место
function moveOriginV3(root) {
    const data = getSchematicObjectV3(root)
    try {
        const [x, y, z] = data.Metadata.value.WorldEdit.value.Origin.value
        root.value.WEOriginX = {type: 'int', value: x}
        root.value.WEOriginY = {type: 'int', value: y};
        root.value.WEOriginZ = {type: 'int', value: z};

        delete root.value.Schematic.value.Metadata.value.WorldEdit.value.Origin.value;
    } catch (e) {
        console.error(e)
        toastError(`moveOriginV3 error`)
    }
}

// Перемещает плиточные объекты на старое место и изменяет их позицию и ID
function moveTileEntitiesV3(root) {
    const data = getSchematicObjectV3(root)
    root.value.TileEntities = {
        type: 'list', value: {
            value: [],
            type: 'compound'
        }
    }

    try {
        root.value.TileEntities = data.Blocks.value.BlockEntities.value.value;
        delete root?.value?.Schematic?.value.Blocks.value.BlockEntities;

        for (const tileEntity of root.value.TileEntities) {
            const {Id, Pos, Data} = tileEntity
            console.log(tileEntity)
            tileEntity.value = Data.value
            tileEntity.type = 'compound'
            // tileEntity.value = {}
            // if (Pos) {
            //     const [tx, ty, tz] = Pos.value
            //     tileEntity.value.x = {type: 'int', value: tx};
            //     tileEntity.value.y = {type: 'int', value: ty};
            //     tileEntity.value.z = {type: 'int', value: tz};
            //
            //     delete tileEntity.value.Pos
            // }
            //
            // if (Id) {
            //     tileEntity.value.id = Id.value
            //
            //     delete tileEntity.value.Id
            // }
        }

        root.value.TileEntities = {
            type: 'list', value: {
                value: [],
                type: 'compound'
            }
        }
    } catch (e) {
        console.error(e)
        toastError(`moveTileEntitiesV3 error`)
    }
}

// Конвертирует данные блока в устаревший формат блоков и данных
function convertBlockDataV3(root) {
    const schematicObjectV3 = getSchematicObjectV3(root)
    try {
        const {Palette, Data} = schematicObjectV3.Blocks.value
        const palette = [];
        const blocks = [];
        let addBlocks = null;
        const data = [];

        for (const key in Palette.value) {
            palette[Palette.value[key].value] = key;
        }

        var varInt = 0;
        var varIntLength = 0;
        var blockId;
        for (const element of Data.value) {
            varInt |= (element & 127) << (varIntLength++ * 7);

            if ((element & 128) == 128) {
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
        // root.value.AddBlocks = {type: 'byteArray', value: (addBlocks) ? addBlocks : []};
        // root.value.Palette = {type: 'compound', value: palette};
        // root.value.Palette = root?.value?.Schematic?.value.Blocks.value.Palette

        delete root?.value?.Schematic?.value.Blocks.value.Data;
        delete root?.value?.Schematic?.value.Blocks.value.Palette;
    } catch (e) {
        console.error(e)
        toastError(`convertBlockDataV3 error`)
    }
}

function getSchematicObjectV3(root) {
    return root?.value?.Schematic?.value
}