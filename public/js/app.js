const App = {
    currentPage: '',

    init: () => {
        App.setActiveNavLink();
        App.setHeaderTitle();
        App.setupMobileMenu();
        App.updateDashboardSummaryCards(); // Tenta atualizar em qualquer página

        // Adiciona um listener para fechar o menu mobile ao clicar em um link
        document.querySelectorAll('.app-sidebar nav ul li a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    const sidebar = document.querySelector('.app-sidebar');
                    sidebar.classList.remove('open');
                     const menuToggle = document.querySelector('.menu-toggle');
                    if (menuToggle) menuToggle.innerHTML = '☰'; // Reset icon
                }
            });
        });
    },

    setActiveNavLink: () => {
        const path = window.location.pathname;
        const pageName = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        App.currentPage = pageName;

        document.querySelectorAll('.app-sidebar nav ul li a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === pageName) {
                link.classList.add('active');
            }
        });
    },

    setHeaderTitle: () => {
        const headerTitleEl = document.querySelector('.app-header .header-title h1');
        if (!headerTitleEl) return;

        const activeLink = document.querySelector('.app-sidebar nav ul li a.active');
        if (activeLink) {
            headerTitleEl.textContent = activeLink.textContent;
        } else if (App.currentPage === 'index.html') {
            headerTitleEl.textContent = 'Dashboard';
        } else {
            // Fallback
            const title = App.currentPage.replace('.html', '').replace('-', ' ');
            headerTitleEl.textContent = title.charAt(0).toUpperCase() + title.slice(1);
        }
    },

    setupMobileMenu: () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.app-sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                if (sidebar.classList.contains('open')) {
                    menuToggle.innerHTML = '✕'; // Ícone de fechar
                } else {
                    menuToggle.innerHTML = '☰'; // Ícone de menu hambúrguer
                }
            });
        }
    },

    showNotification: (message, type = 'info', duration = 3000) => {
        let notificationArea = document.getElementById('notification-area');
        if (!notificationArea) {
            notificationArea = document.createElement('div');
            notificationArea.id = 'notification-area';
            notificationArea.style.position = 'fixed';
            notificationArea.style.top = '20px';
            notificationArea.style.right = '20px';
            notificationArea.style.zIndex = '2000';
            notificationArea.style.display = 'flex';
            notificationArea.style.flexDirection = 'column';
            notificationArea.style.gap = '10px';
            document.body.appendChild(notificationArea);
        }

        const notification = document.createElement('div');
        notification.className = `app-notification ${type}`;
        notification.textContent = message;
        
        // Basic styling for notification
        notification.style.padding = '15px';
        notification.style.borderRadius = 'var(--border-radius)';
        notification.style.color = 'var(--white-color)';
        notification.style.boxShadow = 'var(--shadow-md)';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        if (type === 'success') notification.style.backgroundColor = 'var(--success-color)';
        else if (type === 'error') notification.style.backgroundColor = 'var(--danger-color)';
        else if (type === 'warning') notification.style.backgroundColor = 'var(--secondary-color)';
        else notification.style.backgroundColor = 'var(--primary-color)';

        notificationArea.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);


        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
                if (notificationArea.childElementCount === 0) {
                    // notificationArea.remove(); // Option to remove area if empty
                }
            }, 300);
        }, duration);
    },

    formatCurrency: (value, showSymbol = true) => {
        if (typeof value !== 'number') value = parseFloat(value) || 0;
        const options = { style: 'currency', currency: 'BRL' };
        if (!showSymbol) {
            options.style = 'decimal';
            options.minimumFractionDigits = 2;
            options.maximumFractionDigits = 2;
        }
        return new Intl.NumberFormat('pt-BR', options).format(value);
    },

    parseFloatStrict: (value) => {
        if (typeof value === 'string') {
            // Remove R$, pontos de milhar, e substitui vírgula por ponto decimal
            value = value.replace("R$", "").replace(/\./g, "").replace(",", ".");
        }
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num; // Retorna 0 se não for um número válido
    },

    updateDashboardSummaryCards: () => {
        if (App.currentPage === 'index.html' || document.getElementById('total-insumos')) { // Check if dashboard elements are present
            const insumos = Storage.getItems('insumos') || [];
            const modelos = Storage.getItems('modelos') || [];
            const custosFixos = Storage.getItems('custosFixos') || [];
            const producoes = Storage.getItems('producoes') || [];
            const configuracoes = Storage.getItems('configuracoes') || {};

            const totalCustoFixo = custosFixos.reduce((sum, cf) => sum + App.parseFloatStrict(cf.valor), 0);
            
            // Para produções do mês, um exemplo simples:
            const hoje = new Date();
            const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const producoesEsteMes = producoes.filter(p => {
                const dataProducao = new Date(p.data);
                return dataProducao >= primeiroDiaDoMes && dataProducao <= hoje;
            });

            const elTotalInsumos = document.getElementById('total-insumos');
            if (elTotalInsumos) elTotalInsumos.textContent = insumos.length;
            
            const elTotalModelos = document.getElementById('total-modelos');
            if (elTotalModelos) elTotalModelos.textContent = modelos.length;

            const elTotalCustoFixo = document.getElementById('total-custo-fixo');
            if (elTotalCustoFixo) elTotalCustoFixo.textContent = App.formatCurrency(totalCustoFixo);
            
            const elTotalProducoesMes = document.getElementById('total-producoes-mes');
            if (elTotalProducoesMes) elTotalProducoesMes.textContent = producoesEsteMes.length;
        }
    },

    getElementValue: (id) => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : null;
    },

    setElementValue: (id, value) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    },

    // Função para popular selects
    populateSelect: (selectId, items, valueField, textField, placeholder = "Selecione...") => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = `<option value="">${placeholder}</option>`; // Placeholder
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = typeof textField === 'function' ? textField(item) : item[textField];
            select.appendChild(option);
        });
    },
};

document.addEventListener('DOMContentLoaded', App.init);
