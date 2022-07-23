import express from 'express';
import getLoginData from './functions/getLoginData.mjs';
import getDataGiss from './functions/getDataGiss.mjs';
import path from 'path';
const __dirname = path.resolve();
const app = express();
const port = 80;
import { formatCnpj } from './utils/format.mjs'

app.listen(port, (() => {
    console.log('Listening on port:', port);
}));

app.get("/", ((_, res) => {
    res.sendFile(__dirname + '/index.html')
}));

app.get('/ginfes/relatorio/:cnpj/:mes/:ano', async (req, res) => {

    const cnpj = req.params.cnpj.toString().replace(/[^0-9,.]+/g, "");
    const mes = req.params.mes.toString();
    const ano = req.params.ano.toString();

    if (cnpj.length < 14) {
        const remainingCnpj = cnpj.length - 14;
        cnpj = '0'.repeat(remainingCnpj) + cnpj;
    }

    const {statusCode, message, company, userGiss, pwGiss} = await getLoginData(cnpj);

    if (statusCode === 400) {
        res.json(message);
    } else {
        const { statusCode, data } = await getDataGiss(userGiss, pwGiss, mes, ano);

        res.json({
            statusCode,
            companyName: company,
            formattedCnpj: formatCnpj(cnpj),
            cnpj,
            mes: parseInt(mes, 10),
            ano: parseInt(ano, 10),
            nfes: data
        });
    }
});
