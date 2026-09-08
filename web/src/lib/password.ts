/**
 * ПРАВИЛА ПАРОЛЯ — единственный источник правды для фронта.
 *
 * ВАЖНО: эти правила обязаны совпадать с validatePassword на бэкенде.
 * Разойдутся — и пользователь получит худший из возможных опытов: форма
 * говорит «всё хорошо», кнопка активна, а сервер отвечает отказом без
 * внятного объяснения. Меняете здесь — меняйте и там, одним коммитом.
 */

export const MIN_LENGTH = 10;
export const MAX_LENGTH = 256;

/**
 * Спецсимвол — любой символ, не являющийся буквой или цифрой.
 *
 * Намеренно широкое определение. Короткий белый список вроде
 * ["/", ".", ",", "?", "!", "&"] выглядит строже, но на деле только злит:
 * человек вводит «Гора#Море42», видит отказ и не понимает, чем его решётка
 * хуже точки. А стойкости это не добавляет — перебору всё равно, какой
 * именно символ стоит в пароле.
 */
const SPECIAL = /[^\p{L}\p{N}]/u;
const LOWER = /\p{Ll}/u;
const UPPER = /\p{Lu}/u;

export interface Rule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

export const RULES: Rule[] = [
  {
    id: 'length',
    label: `Не короче ${MIN_LENGTH} символов`,
    test: (pw) => pw.length >= MIN_LENGTH && pw.length <= MAX_LENGTH,
  },
  {
    id: 'case',
    label: 'Заглавная и строчная буквы',
    test: (pw) => LOWER.test(pw) && UPPER.test(pw),
  },
  {
    id: 'special',
    label: 'Хотя бы один знак, кроме букв и цифр',
    test: (pw) => SPECIAL.test(pw),
  },
];

/** Все ли правила выполнены. */
export const isValidPassword = (pw: string) => RULES.every((r) => r.test(pw));

/** Сколько правил пройдено — для полоски прогресса. */
export const passedCount = (pw: string) =>
  RULES.filter((r) => r.test(pw)).length;
