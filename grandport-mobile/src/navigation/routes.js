import Dashboard from '../screens/Dashboard';
import Inventario from '../screens/Inventario';
import CadastroProduto from '../screens/CadastroProduto';
import Produtos from '../screens/Produtos';
import PrevisaoCompras from '../screens/PrevisaoCompras';
import OrcamentoMobile from '../screens/OrcamentoMobile';
import RecebimentoMercadoria from '../screens/RecebimentoMercadoria';
import SeparacaoPedidos from '../screens/SeparacaoPedidos';
import GestaoVendas from '../screens/GestaoVendas';
import Parceiros from '../screens/Parceiros';
import ChecklistMobile from '../screens/ChecklistMobile';
import AgendaMobile from '../screens/AgendaMobile';

export const APP_ROUTES = {
    dashboard: {
        key: 'dashboard',
        component: Dashboard,
        showTabBar: true,
        tabLabel: 'Inicio',
        tabIcon: 'home'
    },
    inventario: {
        key: 'inventario',
        component: Inventario,
        showTabBar: true,
        tabLabel: 'Estoque',
        tabIcon: 'package'
    },
    orcamento: {
        key: 'orcamento',
        component: OrcamentoMobile,
        showTabBar: true,
        tabLabel: 'Balcao',
        tabIcon: 'shopping-cart'
    },
    vendas: {
        key: 'vendas',
        component: GestaoVendas,
        showTabBar: true,
        tabLabel: 'Vendas',
        tabIcon: 'file-text'
    },
    checklist: {
        key: 'checklist',
        component: ChecklistMobile,
        showTabBar: true,
        tabLabel: 'Vistoria',
        tabIcon: 'check-circle'
    },
    parceiros: {
        key: 'parceiros',
        component: Parceiros,
        showTabBar: true,
        tabLabel: 'Clientes',
        tabIcon: 'users'
    },
    agenda: {
        key: 'agenda',
        component: AgendaMobile,
        showTabBar: false
    },
    cadastro: {
        key: 'cadastro',
        component: CadastroProduto,
        showTabBar: false
    },
    produtos: {
        key: 'produtos',
        component: Produtos,
        showTabBar: false
    },
    previsao: {
        key: 'previsao',
        component: PrevisaoCompras,
        showTabBar: false
    },
    recebimento: {
        key: 'recebimento',
        component: RecebimentoMercadoria,
        showTabBar: false
    },
    separacao: {
        key: 'separacao',
        component: SeparacaoPedidos,
        showTabBar: false
    }
};

export const TAB_ROUTES = Object.values(APP_ROUTES).filter(route => route.showTabBar);
