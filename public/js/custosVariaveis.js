// js/custosVariaveis.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#custos-variaveis-page')) { // Adicione um ID ao body do custos-variaveis.html
        loadCustosVariaveis();
        document.getElementById('custoVariavelForm').addEventListener('submit', handleCustoVariavelSubmit);
        document.getElementById('custoVariavelModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('close-button') || e.target.classList.contains('modal')) {
                closeModal('custoVariavelModal');
            }
        });
        document.getElementById('openAddCustoVariavelModal').addEventListener('click', () => openModal('custoVariavelModal'));
    }
});

function loadCustosVariaveis() {
    const custosVariaveis = Storage.load('custosVariaveis');
    const custosVariaveisList = document.getElementById('custosVariaveisList');
    custosVariaveisList.innerHTML = '';

    if (custosVariaveis.length === 0) {
        custosVariaveisList.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum custo variável cadastrado.</td></tr>';
        return;
    }

    let totalPorUnidade = 0;

    custosVariaveis.forEach(custo => {
        totalPorUnidade += parseFloat(custo.valor);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${custo.nome}</td>
            <td>${parseFloat(custo.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="actions">
                <button class="btn btn-info edit-btn" data-id="${custo.id}">Editar</button>
                <button class="btn btn-danger delete-btn" data-id="${custo.id}">Excluir</button>
            </td>
        `;
        custosVariaveisList.appendChild(row);
    });

    document.getElementById('totalCustosVariaveisPorUnidade').textContent = totalPorUnidade.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => editCustoVariavel(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteCustoVariavel(e.target.dataset.id));
    });
}

function handleCustoVariavelSubmit(event) {
    event.preventDefault();

    const custoVariavelId = document.getElementById('custoVariavelId').value;
    const nome = document.getElementById('custoVariavelNome').value;
    const valor = document.getElementById('valorCustoVariavel').value;

    if (!nome || !valor) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const newCustoVariavel = {
        id: custoVariavelId || Storage.generateId(),
        nome: nome,
        valor: parseFloat(valor)
    };

    let success;
    if (custoVariavelId) {
        success = Storage.update('custosVariaveis', custoVariavelId, newCustoVariavel);
    } else {
        success = Storage.add('custosVariaveis', newCustoVariavel);
    }

    if (success) {
        alert(`Custo Variável ${custoVariavelId ? 'atualizado' : 'cadastrado'} com sucesso!`);
        closeModal('custoVariavelModal');
        clearCustoVariavelForm();
        loadCustosVariaveis();
    } else {
        alert('Falha ao salvar o custo variável.');
    }
}

function editCustoVariavel(id) {
    const custoVariavel = Storage.getById('custosVariaveis', id);
    if (custoVariavel) {
        document.getElementById('custoVariavelId').value = custoVariavel.id;
        document.getElementById('custoVariavelNome').value = custoVariavel.nome;
        document.getElementById('valorCustoVariavel').value = custoVariavel.valor;
        document.getElementById('modalTitle').textContent = 'Editar Custo Variável';
        openModal('custoVariavelModal');
    }
}

function deleteCustoVariavel(id) {
    if (confirm('Tem certeza que deseja excluir este custo variável?')) {
        if (Storage.remove('custosVariaveis', id)) {
            alert('Custo Variável excluído com sucesso!');
            loadCustosVariaveis();
        } else {
            alert('Falha ao excluir o custo variável.');
        }
    }
}

function clearCustoVariavelForm() {
    document.getElementById('custoVariavelForm').reset();
    document.getElementById('custoVariavelId').value = '';
    document.getElementById('modalTitle').textContent = 'Adicionar Novo Custo Variável';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    clearCustoVariavelForm();
}
