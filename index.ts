import express from "express";
import getLoginData from "./functions/getLoginData";
import getDataGiss from "./functions/getDataGiss";

const app = express();
const port = 80;

import { formatCnpj } from "./utils/format";

app.listen(port, () => {
    console.log("Listening on port:", port);
});

app.get("/", (_, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/ginfes/relatorio/:cnpj/:month/:year/:sheet", async (req, res) => {

    let cnpj = req.params.cnpj.toString().replace(/[^0-9,.]+/g, "");
    const month = req.params.month.toString();
    const year = req.params.year.toString();
    const has_sheet = req.params.sheet.toString().toLowerCase() === "true";

    if (cnpj.length < 14) cnpj = "0".repeat(cnpj.length - 14) + cnpj;

    const { statusCode, message, companyName, user, pw } = getLoginData(cnpj);

    if (statusCode === 400) {
        res.json(message);
    } else {
        const { statusCode, data } = await getDataGiss(
            user,
            pw,
            month,
            year,
            has_sheet
        );

        if (statusCode === 400) res.json({ statusCode, data });

        res.json({
            statusCode,
            companyName,
            formattedCnpj: formatCnpj(cnpj),
            cnpj,
            month: parseInt(month, 10),
            year: parseInt(year, 10),
            nfes: data,
        });
    }
});
