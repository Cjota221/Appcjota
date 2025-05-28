const Storage = {
    prefix: 'appCJ_v1_', // Adicionando versão para facilitar futuras migrações

    initialize: () => {
        const defaultKeys = {
            insumos: [],
            modelos: [],
            custosFixos: [],
            custosVariaveis: [],
            producoes: [],
            estoque: {}, // { insumoId: quantidade }
            configuracoes: {
                margemLucroPadrao: 0.5, // 50%
                volumeProducaoMensalEstimado: 100,
                // Não precisa mais de proximoId, usaremos UUIDs
            }
        };

        for (const key in defaultKeys) {
            if (localStorage.getItem(Storage.prefix + key) === null) {
                Storage.saveItems(key, defaultKeys[key]);
            }
        }
    },

    getItems: (key) => {
        const item = localStorage.getItem(Storage.prefix + key);
        try {
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`Erro ao parsear item do localStorage ${key}:`, e);
            // Em caso de erro, tenta retornar o valor padrão para essa chave
            const defaultValues = { insumos: [], modelos: [], custosFixos: [], custosVariaveis: [], producoes: [], estoque: {}, configuracoes: { margemLucroPadrao: 0.5, volumeProducaoMensalEstimado: 100 } };
            return defaultValues[key] || null;
        }
    },

    saveItems: (key, value) => {
        try {
            localStorage.setItem(Storage.prefix + key, JSON.stringify(value));
        } catch (e) {
            console.error(`Erro ao salvar no localStorage ${key}:`, e);
            App.showNotification('Erro ao salvar dados. O armazenamento pode estar cheio.', 'error');
        }
    },

    generateUUID: () => {
        if (self.crypto && self.crypto.randomUUID) {
            return self.crypto.randomUUID();
        } else {
            // Fallback simples (não ideal para produção massiva, mas ok para este escopo)
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    },
    
    exportData: () => {
        const dataToExport = {};
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(Storage.prefix)) {
                dataToExport[key.replace(Storage.prefix, '')] = Storage.getItems(key.replace(Storage.prefix, ''));
            }
        });
        
        if (Object.keys(dataToExport).length === 0) {
            App.showNotification('Nenhum dado para exportar.', 'info');
            return;
        }

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date();
        const dateString = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}${date.getMinutes().toString().padStart(2,'0')}`;
        a.download = `appcj_backup_${dateString}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        App.showNotification('Dados exportados com sucesso!', 'success');
    },

    importData: (event) => {
        const file = event.target.files[0];
        if (!file) {
            App.showNotification('Nenhum arquivo selecionado.', 'info');
            return;
        }
        if (file.type !== "application/json") {
            App.showNotification('Por favor, selecione um arquivo JSON válido.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (confirm('ATENÇÃO: Isso substituirá TODOS os dados existentes. Deseja continuar?')) {
                    // Limpa dados existentes com o prefixo
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith(Storage.prefix)) {
                            localStorage.removeItem(key);
                        }
                    });

                    // Importa novos dados
                    for (const key in importedData) {
                        // Verifica se a chave é uma das esperadas para evitar importar lixo
                        const validKeys = ['insumos', 'modelos', 'custosFixos', 'custosVariaveis', 'producoes', 'estoque', 'configuracoes'];
                        if(validKeys.includes(key)){
                            Storage.saveItems(key, importedData[key]);
                        }
                    }
                    App.showNotification('Dados importados com sucesso! A página será recarregada.', 'success');
                    setTimeout(() => location.reload(), 1500);
                }
            } catch (error) {
                console.error('Erro ao importar dados:', error);
                App.showNotification('Erro ao processar o arquivo JSON. Verifique o formato.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reseta o input de arquivo
    }
};

// Inicializa o Storage quando o script é carregado
Storage.initialize();
