const {
    map,
    concatMap,
    delay,
    toArray,
    filter,
    find,
    take,
    takeUntil,
    debounceTime,
    distinctUntilChanged,
    switchMap,
    repeatWhen
} = rxjs.operators;
const {from, interval, of, BehaviorSubject, Subject, fromEvent, ReplaySubject, Observable} = rxjs;


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
        //console.log(value);
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


// 9

/*
Сделать подписку, которая будет повторяться каждые N секунд начиная с 5сек и увеличиваясь в
геометрической прогрессии. Завершается автоматом через 60 минут, если за это время подписка
получила ошибку, надо перезапустить поток по новой с 5 сек. тут поможет ReplaySubject. Если
мы за 60 минут получаем нужные нам данные, то тоже завершаем подписку.
    Грубо говоря тебе приходит ответ от бэка с пустым объектом, а тебе нужные данные,
    которые еще бэк не получил и как только пришел не пустой обьект, то можно
    кончать подписку, а если ошибка, то все по новой
*/

function data() {
    return Math.random() > 0.2 ? null : {data: 1};
}


const replaySubject = new ReplaySubject(1);
let timeNewStream = 5 * 1000;
const timeEndStream = 60 * 60 * 1000;

const sub = replaySubject.pipe(
    switchMap(() => interval(timeNewStream).pipe(
        takeUntil(interval(timeEndStream)),
        delay(timeNewStream)
    ))
)
    .subscribe({
        next: () => {
            if (data && Object.keys(data).length) {
                console.log('Данные есть, завершаем подписку');
                sub.unsubscribe();
            } else {
                console.log('Получение данных');
                timeNewStream *= 2;
                replaySubject.next();
            }
        },
        error: (error) => {
            timeNewStream = 5000;
            console.error('Произошла ошибка:', error);
            replaySubject.next();
        },
        complete: () => console.log('Подписка завершена')
    });

//replaySubject.next();


const timeStream$ = new Subject();

const subscription$ = timeStream$.pipe(
    switchMap((newInterval) => interval(newInterval).pipe(
        takeUntil(interval(timeEndStream)),
        repeatWhen(errors => errors.pipe(delay(5000)))
    )),
    switchMap(() => {
        const fetchedData = data();
        if (fetchedData !== null) {
            console.log('Данные есть, завершаем подписку');
            subscription$.unsubscribe();
        } else {
            timeNewStream *= 2;
            console.log('Получение данных');
            timeStream$.next(timeNewStream);
            return new Observable();
        }
    })
)
    .subscribe(
        () => {},
        error => console.error('Произошла ошибка:', error),
        () => console.log('Подписка завершена')
    );

//timeStream$.next(timeNewStream);
