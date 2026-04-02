import React from 'react';
import { LiberacaoAcessos } from '../cadastro/LiberacaoAcessos';

export const CentralSaas = ({ contextoInicial = null }) => {
    return <LiberacaoAcessos modo="central-saas" contextoInicial={contextoInicial} />;
};
