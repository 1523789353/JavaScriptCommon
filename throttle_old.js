/**
 * 防抖, 与vsync同步原理一致
 * @param {Function} fn 函数
 * @param {number} busyTime 最小调用周期
 * @returns {Function} 带防抖效果的函数
 */
function throttle(fn, busyTime) {
    let state = 'idle';
    let task = null;
    function checkTask() {
        if (task !== null) {
            let $task = task;
            task = null;
            setTimeout(checkTask, busyTime);
            $task();
        } else {
            state = 'idle';
        }
    }
    function handler(target, thisArg, args) {
        task = target.bind(thisArg, args)
        if (state === 'idle') {
            state = 'busy';
            checkTask();
        }
    }
    return new Proxy(fn, { apply: handler });
}
