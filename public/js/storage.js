// js/storage.js

const Storage = (function() {
    function save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(`Erro ao salvar dados para a chave ${key}:`, e);
            alert('Não foi possível salvar os dados. O LocalStorage pode estar cheio ou há um problema de permissão.');
            return false;
        }
    }

    function load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Erro ao carregar dados da chave ${key}:`, e);
            return [];
        }
    }

    function add(key, newItem) {
        const items = load(key);
        items.push(newItem);
        return save(key, items);
    }

    function update(key, itemId, updatedItem) {
        let items = load(key);
        const index = items.findIndex(item => item.id === itemId);
        if (index > -1) {
            items[index] = { ...items[index], ...updatedItem };
            return save(key, items);
        }
        return false;
    }

    function remove(key, itemId) {
        let items = load(key);
        const initialLength = items.length;
        items = items.filter(item => item.id !== itemId);
        if (items.length < initialLength) {
            return save(key, items);
        }
        return false;
    }

    function getById(key, itemId) {
        const items = load(key);
        return items.find(item => item.id === itemId);
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function exportData() {
        const allData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                allData[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                console.warn(`Não foi possível parsear item para a chave ${key}`, e);
                allData[key] = localStorage.getItem(key);
            }
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "appcj_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('Backup realizado com sucesso!');
    }

    function importData(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            for (const key in importedData) {
                if (importedData.hasOwnProperty(key)) {
                    localStorage.setItem(key, JSON.stringify(importedData[key]));
                }
            }
            alert('Dados importados com sucesso! A página será recarregada.');
            location.reload();
            return true;
        } catch (e) {
            console.error('Erro ao importar dados:', e);
            alert('Erro ao importar dados. Verifique se o arquivo JSON é válido.');
            return false;
        }
    }

    return {
        save,
        load,
        add,
        update,
        remove,
        getById,
        generateId,
        exportData,
        importData
    };
})();
