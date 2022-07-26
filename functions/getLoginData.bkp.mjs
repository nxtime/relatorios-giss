import login from './mocks/logins.json' assert {type: "json"};

export default function getLoginData(cnpj = null) {
    try {
        if (cnpj.length !== 14) throw new Error('Não foi repassado um CNPJ válido!')

        for (let i = 0; i < login.length; i++)
            if (login[i].cnpj.toString() === cnpj) return login[i];

    } catch (err) {
        return new Promise((res) => res({ statusCode: 400, message: err.message }))
    }
}
