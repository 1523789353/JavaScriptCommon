/** 仿Python range枚举器, 写着玩的 :) */
function* range(...opts) {
    let [start, stop, step] = [
        [0, opts[0], 1],
        [opts[0], opts[1], 1],
        [opts[0], opts[1], opts[2]]
    ][opts.length - 1] ?? {
        get [Symbol.iterator]() {
            throw new Error('expects 1~3 arguments, bug got ' + opts.length);
        }
    };
    for (let i = start; stop < 0 ? i > stop : i < stop; i += step)
        yield i;
}

/**
 * 数组去重方法
 * @param {Array<T>} array 需要去重的数组
 * @returns {Array<T>} 去重后的数组
 */
function union(array) {
    return Array.from(new Set(array));
}

/**
 * 数组打乱方法
 * @param {Array<T>} array 需要打乱的数组
 * @param {number} level 打乱的程度
 * @returns {Array<T>} 打乱后的数组
 */
function messUp(array, level = 1) {
    for (let i of range(0, array.length * level)) {
        let index = i % array.length;
        let randomIndex = parseInt(Math.random() * (array.length - 1));
        if (randomIndex == index)
            randomIndex++;
        [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
    }
    return array
}

/**
 * unicode转义
 * @param {string} string 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function unicodeEscape(string) {
    let specailChars = ['\t', '\r', '\n', '\v', '\f', '\b', '\0', '\'', '\"', '\\'];
    let charArray = Array.from(string);
    let escapedCharArray = charArray.map(char => {
        if (char.charCodeAt(0) < 0xFF && !specailChars.includes(char)) // 于 Latin1 范围内, 且不是特殊字符的不转义
            return char;
        return '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0');
    })
    return escapedCharArray.join('');
}

/**
 * 丑化/混淆代码
 * 注意: 丑化后的代码需要在浏览器环境下运行, 因为使用setTimeout替代了eval
 *       eval(code); == setTimeout(code); == new Function(code)();
 *       如需在其他环境中运行, 请自行替换codeRunner中的对应方法
 * @param {string} code 需要丑化的JavaScript代码
 * @returns {string} 丑化后的JavaScript代码
 */
function uglify(code) {
    // 匹配所有单词
    let allWords = code.match(/\w+/g);
    // 消除重复单词
    let words = union(allWords);
    // 打乱单词顺序
    let wordsMessUp = messUp(words, 3);
    // 单词索引 { [word]: index, ... }
    let words2index = Object.assign(...wordsMessUp.map((item, index) => ({ [item]: index })));

    // 单词正则
    let wordsMatcher = new RegExp(words.join('|'), 'g');
    // 丑化代码
    let uglyCodeBase = code.replaceAll(wordsMatcher, target => words2index[target].toString(36));
    // 经过unicode转义的丑化代码, 用base64的话不仅要实现编码, 还要把解码函数嵌入到codeRunner里(懒)
    let escapedUglyCodeBase = unicodeEscape(uglyCodeBase);

    // 单词分隔符
    let wordSplitor = '\u202e';
    // 解码器
    let codeRunner = `(a,b)=>void (decodeURIComponent(a).replaceAll(/\\w+/g,i=>b[parseInt(i,36)]))`;
    // 生成丑化代码
    let uglyCode = `(${codeRunner})('${escapedUglyCodeBase}','${wordsMessUp.join(wordSplitor)}'.split('${wordSplitor}'));`;

    return uglyCode;
}
