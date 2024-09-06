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

    downloadJsonMapAsObject(list)
}