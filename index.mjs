import express from 'express';
import getLoginData from './functions/getLoginData.bkp.mjs';
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
    res.sendFile(__dirname + '/index.html');
}));

app.get('/ginfes/relatorio/:cnpj/:month/:year/:sheet', async (req, res) => {
    const cnpj = req.params.cnpj.toString().replace(/[^0-9,.]+/g, "");
    const month = req.params.month.toString();
    const year = req.params.year.toString();
    const has_sheet = req.params.sheet.toString();
    
    if (cnpj.length < 14) {
        const remainingCnpj = cnpj.length - 14;
        cnpj = '0'.repeat(remainingCnpj) + cnpj;
    }

    const {statusCode, message, companyName, user, pw} = await getLoginData(cnpj);

    if (statusCode === 400) {
        res.json(message);

    } else {
        const { statusCode, data } = await getDataGiss(user, pw, month, year, has_sheet);
        res.json({
            statusCode,
            companyName,
            formattedCnpj: formatCnpj(cnpj),
            cnpj,
            month: parseInt(month, 10),
            year: parseInt(year, 10),
            nfes: data
        });
    }
});