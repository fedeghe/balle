[![codecov](https://codecov.io/gh/fedeghe/balle/graph/badge.svg?token=vGU3bnEngT)](https://codecov.io/gh/fedeghe/balle) ![Static Badge](https://img.shields.io/badge/Human%20coded-100%25-blue?style=plastic)

<pre>
 _____ _____ __    __    _____
| __  |  _  |  |  |  |  |   __|
| __ -|     |  |__|  |__|   __|
|_____|__|__|_____|_____|_____| 

v. 1.0.47
</pre>


# WTF ?
No... the world does not need that shit but I need to try to understand.

**Just to be clear, this implementation has <u>nothing</u> to do with [A+ promise specs](https://promisesaplus.com/)**

---

### install & test

``` shell
@ yarn
@ yarn test 
@ yarn cover
```
---

### usage

Make a promise :

``` js  
const Balle = require('balle');
const p = new Balle((resolve, reject) => {
    var before = +new Date;
    setTimeout(() => 
        Math.random() > .5
            ? resolve([before, +new Date])
            : reject('that`s the cause')
    , 2000);
})

// deal with success using then
.then(result => console.log(result))

// deal with rejection | thrown error using catch
.catch(whatever => {
    console.log('Failure:');
    console.log(whatever);
})

// do something anyway
.finally(result_cause_error => {
    // get the result in case on resolution or the cause
    // in case of rejection|error
    console.log('Executed regardless the resolution or rejection')
});
```

reject a promise: 

``` js  
const p = new Balle((resolve, reject) => 
    setTimeout(() => reject('Ups... something went wrong'), 1000)
)
.then(() => { throw 'never thrown'; })
.catch((cause) => 
    // this will log
    console.log(cause)
);
```

late launch: 

``` js  
const resolvingPromise = new Balle();

resolvingPromise
.then(() => {
    throw 'Never executed';
})
.catch((cause) => {
    console.log('catched: ' + cause);
}).finally(cause => console.log('finally : ' + cause));

resolvingPromise
.launch((resolve, reject) => 
    setTimeout(function () {
        reject('a problem occurred');
    }, 100)
);
```

resolve:
``` js  
const resolvingPromise = new Balle();
resolvingPromise.resolve('the value');
resolvingPromise.then(v => console.log(v === 'the value'));
``` 

reject: 
``` js  
const rejectingPromise = new Balle();
rejectingPromise.reject('the cause');
rejectingPromise.catch(v => console.log(v === 'the cause'));
```




**Balle.one**

``` js  
// wraps the constructor call
const p1 = new Balle(/* executor func */);
// can be written
const p1 = Balle.one(/* executor func */);
```

**Balle.all**  

``` js  
const init = +new Date;
const p = Balle.all([
    Balle.one((resolve, reject) => 
        setTimeout(() => resolve(500), 1000)
    ),
    Balle.one((resolve, reject) => 
        setTimeout(() => resolve(200), 2000)
    ),
    Balle.one((resolve, reject) => 
        setTimeout(() => resolve(300), 1500)
    ),
])
.then((result) => {
    console.log((+new Date - init)+ ' ≈ 2000');
    console.log(result); // ---> [500, 200, 300]
})
.catch(() => {
    throw 'never thrown';
});
```

**Balle.race** 

``` js  
const init = +new Date;
const p = Balle.race([
    Balle.one((resolve, reject) => 
        setTimeout(() => resolve(500), 1000)
    ),
    Balle.one((resolve, reject) => 
        setTimeout(() => resolve(200), 1500)
    ),
    Balle.one((resolve, reject) => 
        setTimeout(() => resolve(300), 2000)
    ),
])
.then((result) => {
    console.log((+new Date - init) + ' ≈ 1000');
    console.log(result + ' == 500'); 
})
.catch(() => {
    throw 'never thrown';
});
```

**Balle.chain** 

``` js  
Balle.chain([
    () => Balle.one((resolve, reject) => 
        setTimeout(() => 
            Math.random() > .5
                ? reject('a problem occurred at #1')
                : resolve(100)
        , 100)
    ),
    r => Balle.one((resolve, reject) => 
        setTimeout(() => 
            Math.random() > .5
                ? reject('a problem occurred at #2')
                : resolve(101 + r)
        , 200)
    ),
    r => Balle.one((resolve, reject) => 
        setTimeout(() => 
            Math.random() > .5
                ? reject('a problem occurred at #3')
                : resolve(102 + r)
        , 300)
    )
])
.then(r => console.log('result : '+ r))
.catch(cause => console.log('cause : '+ cause))
.finally(() => console.log('----- finally -----'));
```

**Balle.all async errors**

``` js  
Balle.all([
    Balle.one((res, rej) => 
        setTimeout(() => res(3), 1300)
    ),
    Balle.one((res, rej) => 
        setTimeout(() => {
            try {
                throw 'Error occurred';
            } catch(e) { rej(e); }
        }, 200)
    )
])
.then(r => console.log('The result is', r))
.catch(err => console.log('The error is', err));
```