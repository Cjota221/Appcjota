# AppCJ - Calculadora de Custos para Fábricas de Calçados e Pequenas Indústrias

AppCJ é uma aplicação web **100% funcional, responsiva e moderna** para calcular custos de produção e sugerir preços de venda para indústrias de calçados ou pequenas fábricas. Construída utilizando apenas **HTML, CSS e JavaScript puro (sem frameworks)**, ela funciona completamente **offline** com `LocalStorage`, garantindo agilidade e portabilidade.

## ✨ Funcionalidades

* **Cadastro de Insumos:** Gerencie todos os materiais e seus custos unitários.
* **Cadastro de Modelos:** Crie modelos de produtos, associe insumos, defina a composição e faça upload de imagens. O sistema calcula automaticamente o custo total do modelo.
* **Custos Fixos:** Registre despesas mensais que são rateadas pela produção.
* **Custos Variáveis:** Adicione custos por unidade de produto (ex: embalagem, frete).
* **Cálculo Automático de Custos e Preços:**
    * Custo total por modelo (considerando insumos, custos fixos rateados e variáveis).
    * Sugestão de preço de venda com base em uma margem de lucro desejada.
    * Exibição do lucro estimado por par.
* **Produção:** Registre lotes de produção, consumindo insumos e gerando resumos de custo e lucro.
* **Estoque de Insumos (Simples):** Controle básico de saída de insumos com base nas produções.
* **Relatórios Simples:** Visualize resumos de custos por modelo e consumo de insumos com gráficos interativos (Chart.js).
* **Backup e Restauração:** Exporte e importe todos os seus dados em formato JSON, garantindo a segurança e a portabilidade.
* **Offline First:** Toda a aplicação funciona localmente no navegador, sem necessidade de conexão com a internet ou backend.

## 🎨 Design e UI/UX

O AppCJ foi projetado com uma interface **visualmente agradável e fácil de usar**, seguindo o estilo de **cards/quadradinhos** que facilitam a leitura e a interação.

* **Tema Escuro:** Predominantemente escuro com alto contraste.
* **Paleta de Cores:**
    * **Primária:** `#dc2eda` (pink vibrante)
    * **Secundária:** `#f2ea21` (amarelo vibrante)
    * **Complementos:** branco, cinza escuro, preto
* **Responsivo:** Totalmente adaptado para desktop, tablet e smartphone.
* **Navegação:** Menu lateral (sidebar) fixo e header fixo para uma experiência de usuário consistente.

## 🚀 Como Usar

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/AppCJ.git](https://github.com/seu-usuario/AppCJ.git)
    cd AppCJ
    ```
2.  **Abra no Navegador:** Abra o arquivo `index.html` diretamente no seu navegador.
3.  **Comece a Usar:** Navegue pelas seções (Insumos, Modelos, Custos Fixos, etc.) e comece a cadastrar seus dados. Todos os dados são salvos automaticamente no `LocalStorage` do seu navegador.

## 📦 Estrutura de Pastas
