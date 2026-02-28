import api from '../api/axios';

export const Inventario = () => {
    const [produto, setProduto] = useState(null);

    const buscarProduto = async (ean) => {
        try {
            const res = await api.get(`/api/produtos/mobile/scan/${ean}`);
            setProduto(res.data);
        } catch (err) {
            alert("Peça não encontrada no estoque da GrandPort");
        }
    };

    return (
        <View style={{ padding: 20 }}>
            {!produto ? (
                <Scanner onScan={buscarProduto} />
            ) : (
                <View>
                    <Image
                        source={{ uri: `http://SEU_IP:8080${produto.fotoLocalPath}` }}
                        style={{ width: 200, height: 200 }}
                    />
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{produto.nome}</Text>
                    <Text>Estoque Atual: {produto.quantidadeEstoque}</Text>
                    <Button title="Voltar ao Scanner" onPress={() => setProduto(null)} />
                </View>
            )}
        </View>
    );
};