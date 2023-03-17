/**
 * 防抖hook
 * 在busyTime时间内, 只会执行一次, 如果在busyTime时间内再次调用, 统一返回下次执行的结果
 * @param {function} fn 需要限制执行频率的函数
 * @param {number} busyTime 忙碌时间, 单位毫秒
 * @returns {function} 被代理的函数, 执行结果是一个Promise
 */
function throttle(fn, busyTime) {
    let state = "idle"; // 定义当前的状态, idle表示空闲, busy表示忙碌
    let asyncExec = setTimeout; // 定义异步执行的方法, 可以根据需要修改
    let timer = null; // 定义定时器的变量, 用于清除定时
    let task = null; // 定义当前的任务, 是一个函数
    // task存在则下面三个变量也一定存在, 其中result是一个Promise供外部使用
    let result = null; // 定义当前任务的返回值, 是一个Promise
    let resolve = null; // 定义resolve方法, 用于异步执行任务时, 通知外部任务已经完成
    let reject = null; // 定义reject方法, 用于异步执行任务时, 通知外部任务失败

    // 重置所有状态和属性
    function resetAll() {
        state = 'idle';
        timer = null;
        resetTask();
        return;
    }

    // 重设任务及其结果
    function resetTask() {
        task = null;
        result = null;
        resolve = null;
        reject = null;
        return;
    }

    // 周期末尾任务执行器
    function tailExecutor() {
        // 若无任务则重置所有状态和属性
        if (task == null) {
            resetAll();
            return;
        }
        // 如果使用的是setTimeout, 则需要清除定时器, 以防内存泄漏
        if (asyncExec == setTimeout) {
            clearTimeout(timer);
        }
        // 继续进行检查, 直到没有新任务
        timer = asyncExec(tailExecutor, busyTime);
        // 保留上次task、resolve、reject, 以便执行异步任务, 和通知外部任务结果
        let lastTask = task;
        let lastResolve = resolve;
        let lastReject = reject;
        // 重置任务及其结果
        resetTask();
        // 执行当前周期最末尾的任务
        execute(lastTask, lastResolve, lastReject);
    }

    function execute(task, resolve, reject) {
        return Promise.resolve(task())
            .then((value) => {
                // 在fn成功时, 通知外部任务已经完成
                resolve(value);
            })
            .catch((error) => {
                // 在fn失败时打印错误信息到控制台
                console.error(error);
                // 通知外部任务失败, 以便后续处理
                reject(error);
            })
    }

    async function handler(target, thisArg, args) {
        // 如果result为空, 则创建一个Promise, 否则复用之前的Promise.
        if (result == null) {
            result = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
        }
        if (state == 'idle') {
            // 设置状态为busy
            state = "busy";
            // 在一个忙碌周期结束后检查是否有新任务, 如果有则执行
            timer = asyncExec(tailExecutor, busyTime);
            // 执行当前的任务, 并用Promise.resolve包裹, 以支持异步函数
            execute(target.bind(thisArg, ...args), resolve, reject);
        } else {
            // 如果当前状态为busy, 则将任务保存起来, 以便在周期末尾执行
            task = target.bind(thisArg, ...args);
        }
        return result;
    }

    return new Proxy(fn, { apply: handler });
}
