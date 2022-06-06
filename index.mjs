import express from 'express';
import getLoginData from './functions/getLoginData.mjs';
import getDataGiss from './functions/getDataGiss.mjs';
import path from 'path';
const __dirname = path.resolve();
const app = express();
const port = 80;
import formatData from './functions/formatData.mjs';

app.listen(port, (() => {
    console.log('Listening on port:', port);
}));

app.get("/", ((req, res) => {
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

    console.log(cnpj, mes, ano);

    const userData = await getLoginData(cnpj);
	
    if (userData.status === 'error') {
        console.log("deu ruim");
        res.json(userData)
    } else {
        const response = await getDataGiss(userData.userGiss, userData.pwGiss, mes, ano);
		// console.log(response);
		const data = await formatData(response);
        res.json(JSON.stringify({ 
			status: "ok",
			competencia: mes+"/"+ano,
			companyName: userData.company,
			cnpj: userData.cnpj, 
			...data
		}));
    }
});
