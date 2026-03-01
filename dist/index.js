'use strict';
/*
_____ _____ __    __    _____
| __  |  _  |  |  |  |  |   __|
| __ -|     |  |__|  |__|   __|
|_____|__|__|_____|_____|_____|
                                v. 1.0.47
Author: federico.ghedina@gmail.com
Size: ~4.93KB

*/
Balle.roll = function (els, name, inst) {
    els.forEach(function (func) {
        func(inst[name]);
    }, inst);
};

function Balle(executor) {
    var self = this,
        done = false;
    this.status = Balle.STATUSES.PENDING;
    this.value = null;
    this.cause = null;
    this.resolvers = this.resolvers || [];
    this.rejectors = this.rejectors || [];
    this.finalizers = this.finalizers || [];
    executor = executor || function () {};

    try {
        executor(
            // SOLVER
            function (value) {
                if (done || self.status !== Balle.STATUSES.PENDING) return;
                done = true;
                self.status = Balle.STATUSES.FULFILLED;
                self.value = value;
                Balle.roll(self.resolvers, 'value', self);
                Balle.roll(self.finalizers, 'value', self);
            },
            // REJECTOR
            function (cause) {
                if (done || self.status !== Balle.STATUSES.PENDING) return;
                done = true;
                self.status = Balle.STATUSES.REJECTED;
                self.cause = cause;
                Balle.roll(self.rejectors, 'cause', self);
                Balle.roll(self.finalizers, 'cause', self);
            }
        );
    } catch (e) {
        return Balle.reject(e.message);
    }
    return this;
}

Balle.prototype.resolve = function (value) {
    return Balle.call(this, function (res, rej) {
        return res(value);
    });
};

Balle.prototype.reject = function (value) {
    return Balle.call(this, function (res, rej) {
        return rej(value);
    });
};

Balle.prototype.launch = function (executor) {
    return Balle.call(this, executor);
};

Balle.prototype.then = function (res, rej) {
    switch (this.status) {
        case Balle.STATUSES.REJECTED:
            Balle.roll(this.rejectors, 'cause', this);
            break;
        case Balle.STATUSES.PENDING:
            this.resolvers.push(res);
            rej && this.rejectors.push(rej);
            break;
        case Balle.STATUSES.FULFILLED:
            res(this.value);
            break;
    }
    return this;
};

Balle.prototype.catch = function (rej) {
    switch (this.status) {
        case Balle.STATUSES.PENDING:
            this.rejectors.push(rej);
            break;
        case Balle.STATUSES.REJECTED:
            rej.call(this, this.cause);
            break;
    }
    return this;
};

Balle.prototype.finally = function (cb) {
    this.finalizers.push(cb);
    this.status !== Balle.STATUSES.PENDING
    && Balle.roll(
        this.finalizers,
        this.status === Balle.STATUSES.REJECTED ? 'cause' : 'value',
        this
    );
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

Balle._isFunc = function (f) { return typeof f === 'function'; };

Balle._isIterable = function (obj) {
    if (obj == null) { return false; }
    return Balle._isFunc(obj[Symbol.iterator]);
};

// factory
Balle.one = function (exec) { return new Balle(exec); };

Balle.all = function (pros) {
    if (!Balle._isIterable(pros)) {
        return Balle.reject('Balle.all acceps an Iterable Promise only');
    }
    var results = [],
        l = pros.length,
        solN = 0;

    return new Balle(function (resolve, reject) {
        pros.forEach(function (pro, i) {
            pro.status == 'REJECTED'
                && reject(pro.cause);
            pro.then(function (v) {
                solN++;
                results[i] = v;
                solN == l && resolve(results)
            }).catch(reject)
        });
    });
};

Balle.race = function (pros) {
    if (!Balle._isIterable(pros)) {
        return Balle.reject('Balle.race acceps an Iterable Promise only');
    }
    return new Balle(function (resolve, reject) {
        pros.forEach(function (pro) { pro.then(resolve).catch(reject) });
    });
};

Balle.chain = function (pros) {
    if (!Balle._isIterable(pros)) {
        return Balle.reject('Balle.chain acceps an Iterable Promise only');
    }
    var l = pros.length;
    return new Balle(function (res, rej) {
        (function chain(index, r) {
            return index === l
                ? res(r)
                : pros[index](r)
                    .then(function (r) {
                        chain(++index, r);
                    }).catch(function (r) {
                        rej(r);
                    });
        })(0);
    });
};

Balle.reject = function (cause) {
    return new Balle(function (s, r) { return r(cause); });
};

Balle.resolve = function (mix) {
    return new Balle(function (res, rej) {
        mix instanceof Balle
            ? mix.then(res).catch(rej)
            : res(mix);
    });
};

(typeof exports === 'object') && (module.exports = Balle);
