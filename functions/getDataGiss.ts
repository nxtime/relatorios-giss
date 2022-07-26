import puppeteer from 'puppeteer';

type nfes_types = {
    num_nfe: number;
    day_nfe: number;
    value_nfe: number;
    activitie_nfe: number;
    is_tributed_nfe: boolean
}[] | undefined;

interface CustomChildNode extends ChildNode {
    innerText: string;
}

interface CustomHTMLElement extends HTMLElement {
    childNodes: NodeListOf<CustomChildNode>
}

export default async function getDataGiss(user: number | undefined, pw: string | undefined, month: string, year: string, has_sheet = false) {

    try {
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setupid-sandbox"],
            headless: true,
        });

        const page = await browser.newPage();

        await page.goto('https://portal.gissonline.com.br/login/index.html#', {
            waitUntil: 'networkidle2',
        });

        const mouseClick = () => {
            page.mouse.down({ button: 'left' });
            page.mouse.up({ button: 'left' });
        }

        // Login

        await page.waitForSelector('#TxtIdent');
        await page.type('#TxtIdent', user?.toString()!);

        await page.waitForSelector('#TxtSenha');
        await page.type('#TxtSenha', pw!);

        await page.click("[onclick='document.forms[0].submit();']");

        await page.waitForTimeout(3000);

        // Selecionar Prestador

        await page.waitForSelector('[name="header"]', { timeout: 4000 });

        let header_frame = page.frames().find(frame => frame.name() === 'header');

        await header_frame?.click('[onclick="javascript: clickPrestador(); FunImg(\'5\');"]');

        await page.waitForTimeout(3000);

        await page.waitForSelector('iframe[name="principal"]');

        let principal_frame = page.frames().find(frame => frame.name() === 'principal');
        
        await page.mouse.move(150, 170);
        mouseClick();

        await page.keyboard.type(month);
        await page.keyboard.type(year);

        await page.waitForTimeout(3000);
        await principal_frame?.click('[onclick="if(abreAjuda(\'prestador\',\'p03\') == false){document.getElementById(\'tp2\').checked = true;Caminho();}"]')

        await page.waitForTimeout(6000);

        let table_frame = page.frames().find(frame => frame.name() === 'ifrmLista');

        const nfes: nfes_types = await table_frame?.evaluate(() => {

            const table_rows = document.querySelectorAll('[bgcolor="7fdfff"]').length

            const row_items: nfes_types = []

            for (let row = 0; row < table_rows; row++) {
                const row_item = document.querySelectorAll('[bgcolor="7fdfff"]')[row] as CustomHTMLElement

                if (row_item.childNodes[13].innerText === 'Cancelada')
                    continue;

                row_items.push({
                    num_nfe: parseInt(
                        row_item
                            .childNodes[5]
                            .innerText
                        , 10
                    ),
                    day_nfe: parseInt(
                        row_item
                            .childNodes[7]
                            .innerText
                        , 10),
                    value_nfe: parseFloat(
                        row_item
                            .childNodes[9]
                            .innerText.replace(/[^0-9,]+/g, "")
                            .replace(',', '.')
                        ),
                    activitie_nfe: parseInt(
                        row_item
                            .childNodes[11]
                            .innerText.replace(/[^0-9]+/g, "")
                        , 10),
                    is_tributed_nfe: row_item
                        .childNodes[13]
                        .innerText === 'Tributada'
                })
            };
            return row_items
        });

        browser.close();

        return new Promise<{statusCode: number, data: nfes_types[]}>(resolve => {
            resolve(
                {
                    statusCode: 200,
                    data: [
                        ...[nfes],
                    ]
                }
            )
        });

    } catch (err: any) {
        return { statusCode: 400, data: err.message }
    }
}
