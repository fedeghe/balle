/**
 * 
 * @param {*} executor 
 */
function Balle(executor) {
    var self = this,
        done = false;
    this.status = Balle.STATUSES.PENDING;
    this.value = undefined;
    this.cause = undefined;
    this.resolvers = [];
    this.onCatch = undefined;
    this.onFinally = undefined;
    executor = executor || function () {};
    try {
        executor(function ___SOLVER(value) {
            if (done || self.status !== Balle.STATUSES.PENDING) return;
            done = true;
            self.status = Balle.STATUSES.FULFILLED;
            self.value = value;
            self.resolvers.forEach(function (then) {
                then(self.value);
            }, self);
            Balle._isFunc(self.onFinally) && self.onFinally(self.value)
        }, function ___REJECTOR(cause) {
            if (done || self.status !== Balle.STATUSES.PENDING) return;
            done = true;
            self.status = Balle.STATUSES.REJECTED;
            self.cause = cause;
            Balle._isFunc(self.onCatch) && self.onCatch(self.cause);
            Balle._isFunc(self.onFinally) && self.onFinally(self.cause);
        });
    } catch(e) {
        return Balle.reject(e.message);
    }
    return this;
}

Balle.prototype.then = function (cb) {    
    switch (this.status) {
        case Balle.STATUSES.PENDING:
            this.resolvers.push(cb);
            break;
        case Balle.STATUSES.FULFILLED:
            return cb(this.value);
    }
    
    return this;
};

Balle.prototype.catch = function (cb) {
    switch (this.status) {
        case Balle.STATUSES.PENDING:
            this.onCatch = cb;
            break;
        default:
            return cb(this.cause);
    }
    return this;
};

Balle.prototype.finally = function (cb) {
    this.onFinally = cb;
    return this;
};

/**
 * STATIC section
 */
Balle.STATUSES = {
    PENDING: 'PENDING',
    FULFILLED: 'FULFILLED',
    REJECTED: 'REJECTED'
};

Balle._isFunc = function (f) { return typeof f === 'function';};

Balle._isIterable = function (obj) {
    if (obj == null) { return false; }
    return Balle._isFunc(obj[Symbol.iterator]);
};

// factory
Balle.one = function (exec) { return new Balle(exec); };

Balle.chain = function (pros) {
    //check iterability of pros
    if (!Balle._isIterable(pros)) {
        return Balle.reject('Balle.chain acceps an Iterable Promise only');
    }
    const l  = pros.length;
    return new Balle((res, rej) => {
        (function chain(index, r) {
            return index == l
            ? res(r)
            : pros[index](r).then((r) => {
                chain(++index, r);
            });
        })(0);
    });
};

Balle.all = function (pros) {
    //check iterability of pros
    if (!Balle._isIterable(pros)){
        return Balle.reject('Balle.all acceps an Iterable Promise only');
    }
    var results = [],
        l = pros.length,
        solN = 0;

    return new Balle(function (resolve, reject) {
        pros.forEach((pro, i) => {
            pro.then(function (v) {
                solN++;
                results[i] = v;
                solN == l && resolve(results);
            }).catch(reject);
        });
    });
};

Balle.race = function (pros) {
    //check iterability of pros
    if (!Balle._isIterable(pros)) {
        return Balle.reject('Balle.race acceps an Iterable Promise only');
    }
    return new Balle(function (resolve, reject) {
        pros.forEach(pro => pro.then(resolve).catch(reject));
    });
};

Balle.reject = function (cause) {
    return new Balle(function (s, r) {return r(cause);});
};

Balle.resolve = function (mix) {
    return mix instanceof Balle
        ? new Balle(function (resolve, reject) {
            mix.then(resolve).catch(reject);
        })
        : new Balle(function (s, r) { s(mix); });
};

if (typeof module !== 'undefined'){
    module.exports = Balle;
}