/** Экспорт блоков для плагина */
function downloadBlocksListOnClick() {
    const list = new Map()
    for (const block in blocksNamespace) {
        const id = blocksNamespace[block]
        const filteredName = block.split('[')[0]

        if (!list.get(filteredName)) {
            list.set(filteredName, id)
        }
    }

    downloadYamlMapAsObject(list)
}

function uploadFile(file) {
    console.log('Обработка ' + file.name);
    var fr = new FileReader();
    fr.onload = function () {
        parseSchemFile(fr.result, function (data) {
            var name = file.name;

            if (~name.lastIndexOf('.')) {
                name = name.substr(0, name.lastIndexOf('.'));
            }

            name += '.schematic';

            var blob = new Blob([data], {type: 'application/nbt'});
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = name;
            link.innerHTML = 'Скачать ' + name;
            link.classList.add('btn', 'btn-primary', 'mt-2');
            link.click();
            var li = document.createElement('li');
            li.classList.add('list-group-item');
            li.appendChild(link);
            document.querySelector('#downloads').appendChild(li);
        });
    };
    fr.readAsArrayBuffer(file);
}

function upload(input) {
    for (var i = 0; i < input.files.length; i++) {
        uploadFile(input.files[i]);
    }
}