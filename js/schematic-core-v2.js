// Перемещает данные смещения схемы на старое место
function moveOffsetV2(root) {
    if ('Metadata' in root.value) {
        root.value.WEOffsetX = root.value.Metadata.value.WEOffsetX;
        root.value.WEOffsetY = root.value.Metadata.value.WEOffsetY;
        root.value.WEOffsetZ = root.value.Metadata.value.WEOffsetZ;

        delete root.value.Metadata;
    }
}

// Перемещает данные происхождения схемы на старое место
function moveOriginV2(root) {
    if ('Offset' in root.value) {
        root.value.WEOriginX = {type: 'int', value: root.value.Offset.value[0]};
        root.value.WEOriginY = {type: 'int', value: root.value.Offset.value[1]};
        root.value.WEOriginZ = {type: 'int', value: root.value.Offset.value[2]};

        delete root.value.Offset;
    }
}

// Устанавливает тип материалов схемы
function setMaterialsV2(root) {
    root.value.Materials = {type: 'string', value: 'Alpha'};
}

// Перемещает плиточные объекты на старое место и изменяет их позицию и ID
function moveTileEntitiesV2(root) {
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

// Конвертирует данные блока в устаревший формат блоков и данных
function convertBlockDataV2(root) {
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