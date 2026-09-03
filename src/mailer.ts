import { conf } from './config.js';

export interface Message {
    to: string;
    subject: string;
    text: string;
}

export interface Mailer {
    send(msg: Message): Promise<void>
}

export const consoleMailer: Mailer = {
    async send(msg) {
        console.log(
            `\n──── письмо ────\nКому:  ${msg.to}\nТема:  ${msg.subject}\n\n${msg.text}\n────────────────\n`,
        );
    },
};

export const mailer: Mailer = consoleMailer;

export function verificationEmail(to: string, link: string): Message {
    return {
        to,
        subject: 'Подтвердите адрес почты',
        text:
            `Здравствуйте!\n\n` +
            `Чтобы завершить регистрацию, перейдите по ссылке:\n${link}\n\n` +
            `Ссылка действует ${Math.round(conf.verifyTokenTtl / 3600)} часа.\n` +
            `Если вы не регистрировались — просто проигнорируйте это письмо.`,
    };
}

export function accountExistsEmail(to: string): Message {
    return {
        to,
        subject: 'Попытка регистрации',
        text:
            `Здравствуйте!\n\n` +
            `Кто-то попытался зарегистрироваться с вашим адресом. Аккаунт уже существует.\n` +
            `Если это были вы — просто войдите: ${conf.appUrl}/login\n` +
            `Забыли пароль — восстановите: ${conf.appUrl}/reset\n\n` +
            `Если это были не вы, ничего делать не нужно.`,
    };
}


export function resetEmail(to: string, link: string): Message {
    return {
        to,
        subject: 'Сброс пароля',
        text:
            `Чтобы задать новый пароль, перейдите по ссылке:\n${link}\n\n` +
            `Ссылка действует ${Math.round(conf.resetTokenTtl / 60)} минут.\n` +
            `Если вы не запрашивали сброс — просто проигнорируйте это письмо, ` +
            `пароль останется прежним.`,
    };
}
