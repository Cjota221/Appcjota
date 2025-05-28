// js/insumos.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#insumos-page')) { // Adicione um ID ao body do insumos.html
        loadInsumos();
        document.getElementById('insumoForm').addEventListener('submit', handleInsumoSubmit);
        document.getElementById('insumoModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('close-button') || e.target.classList.contains('modal')) {
                closeModal('insumoModal', clearInsumoForm); // Passa a função de limpar como callback
            }
        });
        document.getElementById('openAddInsumoModal').addEventListener('click', () => {
            clearInsumoForm(); // Garante que o formulário está limpo antes de abrir
            document.getElementById('modalTitle').textContent = 'Adicionar Novo Insumo';
            openModal('insumoModal');
        });
    }
});

function loadInsumos() {
    const insumos = Storage.load('insumos');
    const insumosList = document.getElementById('insumosList');
    insumosList.innerHTML = ''; // Limpa a lista existente

    if (insumos.length === 0) {
        insumosList.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum insumo cadastrado.</td></tr>'; // Alterado colspan de 5 para 4
        return;
    }

    insumos.forEach(insumo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${insumo.nome}</td>
            <td>${insumo.unidadeMedida}</td>
            <td>${parseFloat(insumo.custoUnidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="actions">
                <button class="btn btn-info edit-btn" data-id="${insumo.id}">Editar</button>
                <button class="btn btn-danger delete-btn" data-id="${insumo.id}">Excluir</button>
            </td>
        `;
        insumosList.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => editInsumo(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteInsumo(e.target.dataset.id));
    });

    document.getElementById('totalInsumosCount').textContent = insumos.length; // Atualiza o total de insumos
}

function handleInsumoSubmit(event) {
    event.preventDefault();

    const insumoId = document.getElementById('insumoId').value;
    const nome = document.getElementById('insumoNome').value;
    const unidadeMedida = document.getElementById('unidadeMedida').value;
    const custoUnidade = document.getElementById('custoUnidade').value;

    if (!nome || !unidadeMedida || !custoUnidade) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const newInsumo = {
        id: insumoId || Storage.generateId(),
        nome: nome,
        unidadeMedida: unidadeMedida,
        custoUnidade: parseFloat(custoUnidade)
    };

    let success;
    if (insumoId) {
        success = Storage.update('insumos', insumoId, newInsumo);
    } else {
        success = Storage.add('insumos', newInsumo);
    }

    if (success) {
        alert(`Insumo ${insumoId ? 'atualizado' : 'cadastrado'} com sucesso!`);
        closeModal('insumoModal', clearInsumoForm);
        loadInsumos();
    } else {
        alert('Falha ao salvar o insumo.');
    }
}

function editInsumo(id) {
    const insumo = Storage.getById('insumos', id);
    if (insumo) {
        document.getElementById('insumoId').value = insumo.id;
        document.getElementById('insumoNome').value = insumo.nome;
        document.getElementById('unidadeMedida').value = insumo.unidadeMedida;
        document.getElementById('custoUnidade').value = insumo.custoUnidade;
        document.getElementById('modalTitle').textContent = 'Editar Insumo';
        openModal('insumoModal');
    }
}

function deleteInsumo(id) {
    if (confirm('Tem certeza que deseja excluir este insumo?')) {
        if (Storage.remove('insumos', id)) {
            alert('Insumo excluído com sucesso!');
            loadInsumos();
        } else {
            alert('Falha ao excluir o insumo.');
        }
    }
}

function clearInsumoForm() {
    document.getElementById('insumoForm').reset();
    document.getElementById('insumoId').value = '';
    // O título do modal será atualizado ao abrir o modal
}

// Funções globais de modal (ou mova para app.js se for usar em várias páginas)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex'; // Exibe o modal para iniciar a transição
    setTimeout(() => {
        modal.classList.add('open');
    }, 10); // Pequeno atraso para permitir que o display:flex seja aplicado antes da transição
}

function closeModal(modalId, callback = null) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('open');
    modal.addEventListener('transitionend', function handler() {
        modal.style.display = 'none'; // Esconde o modal após a transição
        if (callback) {
            callback(); // Executa a função de limpeza (clearForm)
        }
        modal.removeEventListener('transitionend', handler);
    }, { once: true }); // Remove o listener após a primeira execução
}
