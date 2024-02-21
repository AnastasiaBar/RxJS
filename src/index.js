const {map, concatMap, delay, toArray, filter, find, take, takeUntil, debounceTime, distinctUntilChanged} = rxjs.operators;
const {from, interval, of, BehaviorSubject, Subject, fromEvent} = rxjs;


const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const users = [
    {id: 1, name: 'Джон Сина'},
    {id: 5, name: 'Джеки Чан'}
]

const bsObs = new BehaviorSubject(users)

const stopSignal$ = new Subject();

//1. вытащи из потока в подписку поочередно элемент массива с задержкой в одну секунду
from(arr)
    .pipe(
        concatMap(item => of(item).pipe(delay(1000)))
    )
    .subscribe(value => {
        console.log(value);
    });


//2. вытащи из потока в подписку массив с квадратом числа из массива
from(arr)
    .pipe(
        map(value => value * value),
        toArray()
    )
    .subscribe(value => {
        //console.log(value)
    })

//3. получи в подписке массив из четных чисел
from(arr)
    .pipe(
        filter(x => x % 2 === 0),
        toArray()
    )
    .subscribe(value => {
        //console.log(value)
    })

//4.с помощь обеих потоков(2 варианта) arr найди id Джеки Чана, переключись на bsObs и верни в подписку
//его name.Добавь обработку ошибки потока, чтоб она нам выдавала alert  в случае ошибки
from(arr)
    .pipe(
        filter(id => id === users.find(user => user.name === 'Джеки Чан').id),
        concatMap(id => from(users).pipe(
            find(user => user.id === id)
        )),
        map(value => value.name)
    )
    .subscribe(value => {
        bsObs.next(value)
    });

bsObs.subscribe({
    //next: value => console.log(value),
    error: error => alert(error)
})


//5. максимально упрощенно верни нам в подписку объект с Джоном Синой
from(users)
    .pipe(
        find(value => value.name === 'Джон Сина')
    )
    .subscribe(value => {
        //console.log(value)
    })

//6. take(1) & takeUntil(obs$) - чем они отличаются и как завершают подписку

from(arr)
    .pipe(
        take(5)
    )
    .subscribe(value => {
        //console.log(value)
    })

setTimeout(() => {
    stopSignal$.next();
}, 5000);

interval(1000)
    .pipe(
        takeUntil(stopSignal$)
    )
    .subscribe(value => {
        //console.log(value)
    })

//7. создай подписку с интервалом в секунду и заверши ее через 10 сек
interval(1000).pipe(
    takeUntil(interval(10000))
).subscribe({
    //next: value => console.log(value),
    //complete: () => console.log('Подписка завершена')
});

//8. вешаем обработчик на инпут, тормозим ввод на каждые  0.5сек, повторяющееся значение не
// пропускаем в поток. в консоль или в html выведи итоговое пропущенное значение
const inputEl = document.querySelector('.input')

fromEvent(inputEl, 'input')
    .pipe(
        map(value => value.target.value),
        debounceTime(500),
        distinctUntilChanged()
    )
    .subscribe(value => {
        //console.log(value)
    })
