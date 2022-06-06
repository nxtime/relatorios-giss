import * as date from './getDate.mjs';
import puppeteer from 'puppeteer';
import https from 'https';
import merge from 'easy-pdf-merge';

export default async function getDataGiss(loginGiss, senhaGiss, mes, ano) {

    console.log(loginGiss, senhaGiss, mes, ano);
    // mes = mes === null ? '0' + date.lastMonth : mes;
    // ano = ano === null ? date.lastMonthYear.toString() : ano;
    console.log(mes, ano)
    try {
        const browser = await puppeteer.launch({
			args: ["--no-sandbox", "--disable-setupid-sandbox"],
            headless: true,
        });

        const page = await browser.newPage();

        await page.goto('https://portal.gissonline.com.br/login/index.html#', {
            waitUntil: 'networkidle2',
        });
        console.log('Primeira Etapa!')
        const mouseClick = () => {
            page.mouse.down({ button: 'left' });
            page.mouse.up({ button: 'left' });
        }

        await page.waitForSelector('#TxtIdent');
        await page.type('#TxtIdent', loginGiss.toString());

        await page.waitForSelector('#TxtSenha');
        await page.type('#TxtSenha', senhaGiss.toString());

        await page.click("[onclick='document.forms[0].submit();']");

        await page.waitForTimeout(3000);

        await page.waitForSelector('[name="header"]', { timeout: 4000 });

        let headerFrame = page.frames().find(frame => frame.name() === 'header');

        await headerFrame.click('[onclick="javascript: clickPrestador(); FunImg(\'5\');"]');

        await page.waitForTimeout(3000);

        await page.waitForSelector('iframe[name="principal"]');

        let principalFrame = page.frames().find(frame => frame.name() === 'principal');

        await page.mouse.move(150, 170);
        mouseClick();

        await page.keyboard.type(mes);
        await page.keyboard.type(ano);

        await page.waitForTimeout(3000);
        await principalFrame.click('[onclick="if(abreAjuda(\'prestador\',\'p03\') == false){document.getElementById(\'tp2\').checked = true;Caminho();}"]')

        await page.waitForTimeout(6000);

        let tableFrame = page.frames().find(frame => frame.name() === 'ifrmLista'); //Encontra o iframe
        let interval = await tableFrame.$$eval('[bgcolor="7fdfff"]', e => e.length - 1); //Define o intervalo entre todas as notas

        let fNfe = await tableFrame.$$eval('[bgcolor="7fdfff"]', e => e[0].innerText.slice(0, e[0].innerText.indexOf('\t'))); //Pega a primeira nfe
        // let lastNfe = await tableFrame.$$eval('[bgcolor="7fdfff"]', e => e[e.length-1].innerText.slice(0, e[e.length-1].innerText.indexOf('\t'))) //Pega a ultima nfe
        let qtIntervals = 0;
        let nfeIntervals = [];

        let value = await principalFrame.evaluate(() => { return document.querySelectorAll('div')[3].innerText.slice(37, -3) });

        let nfes = await tableFrame.evaluate(() => { //Coloca todas as elementos em uma array
            let divs = [...document.querySelectorAll('[bgcolor="7fdfff"]')];
            let div = divs.map((e) => e.innerText.slice(0, e.innerText.indexOf('\t')));
            return div;
        });

        console.log("Segunda Etapa!")

        let allNfesValues = await tableFrame.evaluate(() => { //Extrai os valores das notas retidas
            let divs = [...document.querySelectorAll('[bgcolor="7fdfff"]')];
            function getAllIndexes(arr, val) { //Faz um loop, para saber o index de todas as ocorrências de alguma String
                var indexes = [], i;
                for (i = 0; i < arr.length; i++)
                    if (arr[i] === val)
                        indexes.push(i);
                return indexes;
            }

            let rows = getAllIndexes(divs[0].innerText, '\t'); //Array com o index de todas as ocorrênccias

            let nValues = [];

            let div = divs.map((e) => e.innerText.slice(e.innerText.indexOf('(D)') + 4, e.innerText.indexOf("\tNor"))); //Extrai, se as divs são canceladas, retidas ou tributadas
            for (i = 0; i < div.length; i++) { //Faz um loop para pegar apenas o valor das notas retidas
                if (div[i].includes('Retida') || div[i].includes('Tributada')) {
                    nValues.push(divs[i].innerText.slice(rows[3] + 1, divs[i].innerText.indexOf(',') + 3));
                }
            }
            return nValues;
        });

        allNfesValues = allNfesValues.map((e) => {
            if (e.includes('\t')) { //Elimina o tab adicional caso tenha
                e = e.slice(1);
            }
            e = e.replace(/\./g, ''); //Remove o ponto, para separar milhar
            e = e.replace(/,/g, '.'); //Troca a virgula para o ponto, decimal americano
            return parseFloat(e); //Transforma string em float
        })

        // await page.pdf({ format: 'A4', path: nomeEmpresa+'_'+mes+'.pdf' })

        let rNfesValues = await tableFrame.evaluate(() => { //Extrai os valores das notas retidas
            let divs = [...document.querySelectorAll('[bgcolor="7fdfff"]')];
            function getAllIndexes(arr, val) { //Faz um loop, para saber o index de todas as ocorrências de alguma String
                var indexes = [], i;
                for (i = 0; i < arr.length; i++)
                    if (arr[i] === val)
                        indexes.push(i);
                return indexes;
            }
            let rows = getAllIndexes(divs[0].innerText, '\t'); //Array com o index de todas as ocorrênccias
            let nValues = [];
            let div = divs.map((e) => e.innerText.slice(e.innerText.indexOf('(D)') + 4, e.innerText.indexOf("\tNor"))); //Extrai, se as divs são canceladas, retidas ou tributadas
            for (i = 0; i < div.length; i++) { //Faz um loop para pegar apenas o valor das notas retidas
                if (div[i].includes('Retida')) {
                    nValues.push(divs[i].innerText.slice(rows[3] + 1, divs[i].innerText.indexOf(',') + 3));
                }
            }
            return nValues;
        });

        rNfesValues = rNfesValues.map((e) => {
            if (e.includes('\t')) { //Elimina o tab adicional caso tenha
                e = e.slice(1);
            }
            e = e.replace(/\./g, ''); //Remove o ponto, para separar milhar
            e = e.replace(/,/g, '.'); //Troca a virgula para o ponto, decimal americano
            return parseFloat(e); //Transforma string em float
        })

        let nfesActivities = await tableFrame.evaluate(() => { //Extrai as atividades
            const loopNumber = document.querySelectorAll('[bgcolor="7fdfff"]').length
            let nValues = [];
            for (let i = 0; i < loopNumber; i++) nValues.push(
                document.querySelectorAll('[bgcolor="7fdfff"]')[i].childNodes[11].innerText.replace(/[^0-9,.]+/g, "")
            );

            return nValues;
        });

        console.log("Terceira Etapa!")
        let nfesStatus = await tableFrame.evaluate(() => { //Extrai, se as divs são canceladas, retidas ou tributadas
            let divs = [...document.querySelectorAll('[bgcolor="7fdfff"]')];
            let div = divs.map((e) => e.innerText.slice(e.innerText.indexOf('(D)') + 4, e.innerText.indexOf("\tNor")));
            div = div.map(e => e.slice(0, e.indexOf('\t')));
            return div;
        });

        let normalNfeStatus = nfesStatus.filter(e => e != 'Cancelada');

        let cNfe = [];
        let rNfe = [];
        let tNfe = nfes;

        for (let i = 0; i < interval; i++) {
            if (nfesStatus[i].includes('Cancelada')) {
                cNfe.push(nfes[i]); //Separa as notas canceladas
                tNfe = tNfe.filter(item => item !== nfes[i]); //Remove as notas canceladas entre as tributadas
            } else if (nfesStatus[i].includes('Retida')) {
                rNfe.push(nfes[i]); //Separa as notas retidas
                // tNfe = tNfe.filter(item => item !== nfes[i]); //Remove as notas retidas entre as tributadas
            }
        }
        tNfe = tNfe.map(e => parseInt(e));

        let withinNfeIntervals = false;
        let withoutNfeIntervals = false;
        let qtWithinNfeIntervals = 0;

        for (let i = 0; i < tNfe.length; i++) {

            if (tNfe[i] == tNfe[0]) { //Checa se é o primeiro loop
                nfeIntervals.push(tNfe[0]); //Adiciona o primeiro nº na array
            }
            if (tNfe[i] == tNfe[i + 1] - 1) { //Checa se tem sequência
                if (qtWithinNfeIntervals == 0) { //Checa se é o primeiro nº da sequência
                    if (tNfe[i] == tNfe[0]) { //Checa se é o primeiro loop
                        qtWithinNfeIntervals++;
                    } else {
                        withinNfeIntervals = true;
                        qtWithinNfeIntervals++;
                    }
                }
            } else { //Não é sequência
                if (tNfe[i] == tNfe[0]) { //Caso seja o primeiro loop, primeiro nº da array
                    nfeIntervals.push(tNfe[0]);
                } else { // Caso não seja o primeiro loop
                    if (tNfe[i + 1] == tNfe[tNfe.length - 1]) { //Caso seja o ultimo nº da array
                        console.log(tNfe[i])
                        nfeIntervals.push(tNfe[i]);
                        break;
                    } else { //Caso seja qualquer outro nº != 0 && != -1 da array
                        if (tNfe[i] != tNfe[i + 1] - 1 && tNfe[i] != tNfe[i - 1] + 1) {
                            nfeIntervals.push(tNfe[i]);
                        }
                        withoutNfeIntervals = true;
                        qtWithinNfeIntervals = 0;
                    }
                }
            }
            if (withinNfeIntervals) nfeIntervals.push(tNfe[i]); //Caso tenha sequência adicione a array
            if (withoutNfeIntervals) nfeIntervals.push(tNfe[i]); //Caso não tenha sequência adicione a array

            withinNfeIntervals = false;
            withoutNfeIntervals = false;
        }
        qtIntervals = nfeIntervals.length / 2;

        console.log("Notas canceladas: " + cNfe);
        console.log("Notas retidas: " + rNfe);
        console.log("Notas tributadas: " + tNfe);
        // console.log("Número da primeira NFE: "+fNfe);
        // console.log("Número da ultima NFE: "+lastNfe);
        // console.log("Quantidade de Notas: " + interval);
        // console.log("Quantidade de intervalos: " + qtIntervals);
        // console.log("Intervalos entre: " + nfeIntervals);
        console.log("Competência " + mes + "/" + ano);
        // console.log("Das no valor de: " + value);
        console.log(nfesActivities);

        let qtNfesActivities = [nfesActivities[0]];
        nfesActivities.map(e => {
            for (let i = 0; i < nfesActivities; i++) {
                if (e != qtNfesActivities[i]) {

                }
            }
        })

        value = value.replace("R$ ", ""); //Remove o R$ e o espaço
        value = value.replace(/\./g, ''); //Remove o ponto, para separar milhar
        value = value.replace(/,/g, '.'); //Troca a virgula para o ponto, decimal americano
        value = parseFloat(value);

        let rNfeValue = 0;
        rNfesValues.map((e) => rNfeValue += e);

        browser.close();
        console.log("Quarta Etapa!")
        // console.log({ totalValues: allNfesValues, activities: nfesActivities, status: normalNfeStatus, totalRetificatedValue: rNfeValue, tributated: tNfe, retificated: rNfe, canceled: cNfe, mes: mes, ano: ano });
        return {
            status: 'ok',
            data: { 
				nfeNum: nfes,
				totalValues: allNfesValues, 
				activities: nfesActivities, 
				status: nfesStatus, 
				totalRetificatedValue: rNfeValue, 
				tributated: tNfe, 
				retificated: rNfe, 
				canceled: cNfe, 
				mes: mes, 
				ano: ano 
			}
        };
    } catch (err) {
        console.log("Erro ao pegar os dados!");
        return { status: 'error', message: err.message }
    }
}
