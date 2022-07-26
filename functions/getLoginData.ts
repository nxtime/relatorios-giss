import login from "./mocks/logins.json";

// type failResponseType = {
//     statusCode: number;
//     message: string;
// };

interface responseType {
    statusCode?: number;
    message?: string;
    companyName?: string;
    cnpj?: number;
    user?: number;
    pw?: string
}

export default function getLoginData(cnpj: string): responseType {
    try {
        const empresa: any = login.filter(e => e.cnpj === cnpj);
        return empresa
        // return new Promise(res => res(login.filter(e => e.cnpj === cnpj)));
        // for (let i = 0; i < login.length; i++)
        //     if (login[i].cnpj.toString() === cnpj) return login[i];
    } catch (err: any) {
        return {statusCode: 400, message: err.message}

        // return new Promise((res => res({
        //         statusCode: 400,
        //         message: err.message,
        //     });
        // );
    }
}
