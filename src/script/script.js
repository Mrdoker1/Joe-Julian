'use strict'

const spinnerSpeed = 10,
    spinnerWaiting = 1000,
    discountTime = 360,
    qKG = 0.45359237,
    qLbs = 1/qKG,
    qCm = 2.54,
    monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
let buttonEvent = "click";

function Vector(x,y){
    return {
        x : x,
        y : y,
        sum(v){
            return new Vector(this.x + v.x, this.y + v.y);
        },
        diff(v){
            return new Vector(this.x - v.x, this.y - v.y);
        },
        mul(i){
            return new Vector(this.x * i, this.y * i);
        },
        lenght(){
            return (this.x**2 + this.y**2)**0.5;
        },
        set(x,y=this.y){
            this.x = x;
            this.y = y;
        },
        setV(v){
            this.x = v.x;
            this.y = v.y;
        }
    }
}

function load(){
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        moveable = false;
        buttonEvent = "touchstart"
    }

    fetch("./src/json/data.json")
        .then((r)=>r.json())
        .then((j)=>{
            data = j;
            ready();
        })

    statusBarNext.addEventListener(buttonEvent, ()=> {
        if(!validator()) return;
        if(qNumber < (data.quiz.length - 1))
            changeStates[1](1)
        else{
            document.querySelector("#q"+(data.quiz.length-1)).classList.add("hidden");
            qNumber++;
            changeStates[qNumber - data.quiz.length + 2]()
        }
    });
    statusBarBack.addEventListener(buttonEvent, ()=> {
        if(qNumber > 0)
            if (qNumber < (data.quiz.length))
                changeStates[1](-1)
            else{
                qNumber--;
                if(qNumber < data.quiz.length){
                    document.querySelector("#q101").classList.add("hidden");
                    changeStates[1](0)
                }else changeStates[qNumber - data.quiz.length + 2](0)
            }
    });
    [...q101Inputs, ...q102Inputs,...q104Inputs].forEach(i=>i.addEventListener("input", (e)=>validator(e)));
    document.querySelector('#q104 .next-button').addEventListener(buttonEvent, ()=> {
        changeStates[6]();
    });
    document.querySelectorAll("input[name='measurement-system']").forEach(i=>i.addEventListener("change",()=>{
        console.log(i.value);
        answers.system = i.value;
        validator();
    }))

    document.querySelectorAll('#q105 .plan-button').forEach((b)=>b.addEventListener(buttonEvent, ()=> {
        changeStates[7]();
    }));
    document.querySelectorAll(".gender-icon").forEach(b=>b.addEventListener(buttonEvent,(e)=>{
        answers.gender = parseInt(b.value);
        qNumber = 0;
        welcomeArticle.classList.add("hidden");
        footer.classList.add("hidden");
        statusBar.classList.remove("hidden");
        changeStates[1](0);
    }, false));
    stripePay();
}
//document.addEventListener("DOMContentLoaded", load)

function ready(){
    console.log(data);
    createQuiz(data.quiz);
    for(let i = data.quiz.length-1; i>=0; i--)
        statusBarLine.insertAdjacentHTML("afterbegin", `<li><span>${data.quiz[i].status}</span></li>`)
    statusBarLine.style.setProperty("--max-count",data.quiz.length+3)
    changeStates[0]()
    //test();
}

let qNumber = 0, status = 0,
    timer = document.querySelector("#timer"),
    spinner = document.querySelector("#spinner"),
    after50 = spinner.querySelector(".left > div"),
    before50 = spinner.querySelector(".right > div"),
    statusBar = document.querySelector("#status-bar"),
    statusBarNext = document.querySelector("#status-bar-next"),
    statusBarBack = document.querySelector("#status-bar-back"),
    statusBarStatus = document.querySelector("#status-bar-status"),
    statusBarLine = document.querySelector("#status-bar-line"),
    footer = document.querySelector("footer"),
    content = document.querySelector("#content"),
    goalList = document.querySelector("#goal-list"),
    insertQuizBefore = document.querySelector("#q101"),
    welcomeArticle = document.querySelector("#q100"),
    q101Inputs = [
        ...document.querySelectorAll('input[id*="us-input"]'),
        document.querySelector('input[id*="metric-input"]'),
        document.querySelector('input[id*="input-age"]')
    ], q102Inputs = [
        ...document.querySelectorAll('input[id*="weight-kg"]'),
        ...document.querySelectorAll('input[id*="weight-lbs"]'),
    ], q104Inputs = [
        document.querySelector('input[id="email-input"]'),
        document.querySelector('input[id="name-input"]')
    ],
    spinnerStatus = document.querySelector("#spinner-status"),
    newValidator = (v=()=>true, setDisabled=true)=>{
        return (...args)=>{
            if(v(...args)) {
                (setDisabled && statusBarNext.removeAttribute("disabled"));
                return true;
            }
            (setDisabled && statusBarNext.setAttribute("disabled", true));
            return false;
        }
    }, validator = newValidator(),
    moveable = true, data, answers = {},
    changeStates;

function getOrdinal(d) {
    if (d > 3 && d < 21)
        return 'th';
    switch (d % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}
function getMonday(d) {
    d = new Date(d);
    let day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}
function calcBmi(kg, htc) {
    let m, h2, bmi, f_bmi, diff;
    m = htc / 100.0;
    bmi = kg / (m * m);
    return parseFloat(bmi.toFixed(1));
}
function calcBmr(gender, kg, cm, age) {
    if (gender === 'male')
        return (10 * kg) + (6.25 * cm) - (5 * age) + 5;
    else
        return (10 * kg) + (6.25 * cm) - (5 * age) - 161;
}
function toLbs(kg) {
    return kg * qLbs;
}
function toKg(lbs) {
    return lbs * qKG;
}
function toInch(ft,inch=false) {
    return (typeof inch == "number"?ft * 12 + inch: ft / qCm);
}
function toCm(ft, inch=false){
    return qCm * (inch?toInch(ft,inch):ft);
}

function quizValidation() {
    let target = answers["q"+qNumber];
    //console.log(target)
    if((typeof target == "object") || (typeof target == "number"))
        return true;
    else
        return false;
}
function heightAndAgeValidation(e) {
    if(e){
        if(e.target === q101Inputs[0]){
            let number = parseInt(e.target.value);
            if(number > 0)
                q101Inputs[1].focus();
        }
        if(e.target === q101Inputs[1]){
            if((e.target.value+"").length > 1 )
                q101Inputs[3].focus();
        }
    }
    let allGood = true;
    q101Inputs.forEach((i,index)=>{
        if(answers.system == 1 && (index == 0 || index == 1)) return;
        else if(answers.system == 0 && index == 2) return;
        //console.log("check:",i);
        let value = parseInt(i.value)||0, max = parseInt(i.getAttribute("max"))+1, min = parseInt(i.getAttribute("min"))-1;
        if(!allGood) return;
        allGood = allGood? (value < max)&&(value > min): allGood;
    })
    if(answers.system == 0){
        let heigth = toInch(parseInt(q101Inputs[0].value), parseInt(q101Inputs[1].value||0));
        allGood = (heigth > 41?(heigth < 95?allGood:false):false);
    }
    return allGood;
}
function weightValidation(e) {
    let allGood = true;
    q102Inputs.forEach((i,index)=>{
        if(answers.system == 1 && (index == 2 || index == 3)) return;
        else if(answers.system == 0 && (index == 0 || index == 1)) return;
        //console.log("check:",i)
        let value = parseInt(i.value)||0, max = parseInt(i.getAttribute("max"))+1, min = parseInt(i.getAttribute("min"))-1;
        if(!allGood) return;
        allGood = allGood? (value < max)&&(value > min): allGood;
    })
    return allGood;
}
function nameAndEmailValidation(e) {
    if((q104Inputs[0].value.trim().length > 4) && (q104Inputs[1].value.trim().length > 2)){
        document.querySelector('#q104 .next-button').removeAttribute("disabled")
        return true;
    } else {
        document.querySelector('#q104 .next-button').setAttribute("disabled",true)
        return false;
    }
}

function test() {
    answers.gender = 0;
    answers.system = 1;
    answers.q0 = 3;
    answers.height_cm = 170;
    answers.weigth_kg = 65;
    answers.weigth_kg_goal = 75;
    answers.age = 22;
    changeStates[6]();
}

function stripePay() {
    let PUBLISHABLE_KEY = "pk_test_7YuiTvxnVVtw9IcwZQmVlivw",
        DOMAIN = window.location.origin + window.location.pathname,
        PRICE_ID = "price_1HRqLSI3xZYAtseNpmGRptcO",
        stripe = Stripe(PUBLISHABLE_KEY);

    // Handle any errors from Checkout
    var handleResult = function(result) {
        if (result.error) {
            var displayError = document.getElementById("error-message");
            displayError.textContent = result.error.message;
        }
    };

    document.querySelector('#payment-button').addEventListener("click", function() {
        let quantity = 1;

        if(localStorage)
            localStorage.setItem("user-name",q104Inputs[1].value);

        // Make the call to Stripe.js to redirect to the checkout page
        // with the current quantity
        stripe
            .redirectToCheckout({
                mode: 'payment',
                lineItems: [{ price: PRICE_ID, quantity: quantity }],
                successUrl:
                    DOMAIN + "/success.html?session_id={CHECKOUT_SESSION_ID}",
                cancelUrl: DOMAIN + "./canceled.html"
            })
            .then(handleResult);
    });
}
function getData() {
    answers.height_ft = parseInt(q101Inputs[0].value)||0;
    answers.height_inch = parseInt(q101Inputs[1].value)||0;
    answers.height_cm = parseInt(q101Inputs[2].value)||0;
    answers.weigth_lbs = parseInt(q102Inputs[2].value)||0;
    answers.weigth_lbs_goal = parseInt(q102Inputs[3].value)||0;
    answers.weigth_kg = parseInt(q102Inputs[0].value)||0;
    answers.weigth_kg_goal = parseInt(q102Inputs[1].value)||0;
    answers.age = parseInt(q101Inputs[3].value)||0;
    answers.name = q104Inputs[0].value||"unknown";
    answers.email = q104Inputs[1].value||"unknown";
}
function calcuteResult(){
    let height = (answers.system==0?toCm(answers.height_ft,answers.height_inch):answers.height_cm),
        weigth = (answers.system==0?toKg(answers.weigth_lbs):answers.weigth_kg),
        weigth_goal = (answers.system==0?toKg(answers.weigth_lbs_goal):answers.weigth_kg_goal),
        weigth_text = (answers.system==0?answers.weigth_lbs:answers.weigth_kg),
        weigth_goal_text = (answers.system==0?answers.weigth_lbs_goal:answers.weigth_kg_goal),
        weight_unit = (answers.system==0?'lbs':'kg'),
        dweight = toLbs(weigth - weigth_goal),
        gain = dweight>=0 ? false: true,
        bmi = calcBmi(weigth, height),
        bmi_text = (bmi < 18.5?"underweight":(bmi < 25?"normal weight":(bmi < 30?"overweight":"obese"))),
        bmi_goal = calcBmi(weigth_goal, height),
        bmr = calcBmr(answers.gender, weigth, height, answers.age),
        days = (!gain?dweight*2:Math.abs(dweight)*3.5),
        today = new Date(),
        goal_day = new Date(),
        week = "",
        activity = answers.q0,
        meta_age = answers.age + (3 - activity) + (bmi < 18.5?1:(bmi < 25?0:(bmi < 30?1:2))),
        weigth_curve_text = document.querySelectorAll('#weigth-curve-text text'),
        metabolic_age = document.querySelectorAll('#metabolic-age text'),
        anxiety_factors_paths = document.querySelectorAll('#anxiety-factors path'),
        anxiety_factors = (activity % 3 == 0?[4,'mildly stressed']:[8,'highly stressed']),
        energy_metabolism = (activity < 2?'Right now, you may not be efficiently turning the food you eat into energy.':'Your metabolism seems to be working average for your age.');

    goal_day.setDate(today.getDate() + days);
    weigth_curve_text[0].innerHTML = `${monthNames[today.getMonth()].substring(0,3)} ${today.getDate()}`;
    weigth_curve_text[1].innerHTML = `${monthNames[goal_day.getMonth()].substring(0,3)} ${goal_day.getDate()}`;
    weigth_curve_text[2].innerHTML = `${weigth_text} ${weight_unit}`;
    weigth_curve_text[3].innerHTML = `${weigth_goal_text} ${weight_unit}`;
    today.setDate(today.getDate()+(8-(today.getDay()||7)));
    for(let i=0; i < 7; today.setDate(today.getDate()+1), i++) week += `<td>${today.getDate()}</td>`;
    document.querySelector('#goal-week').innerHTML = week;
    if(gain) document.querySelector('#weigth-curve').classList.add("gain");
    document.querySelector('#goal-month').innerHTML = `${monthNames[today.getMonth()]}, ${today.getFullYear()}`;
    document.querySelector('#gain-weigth-speed').innerHTML = `${gain?'+':'-'}5lbs`;
    document.querySelector('#goal-weigth-output').innerHTML = `${weigth_goal_text} ${weight_unit}`;
    document.querySelector('#goal-weigth-date').innerHTML = `by ${monthNames[goal_day.getMonth()]} ${goal_day.getDate()+getOrdinal(goal_day.getDate())}, ${goal_day.getFullYear()}`;

    document.querySelector('#gender-icon-'+answers.gender).style.setProperty("display", "initial");

    document.querySelector('#bmi-text').innerHTML = bmi_text.toUpperCase();
    document.querySelector('#bmi-index').innerHTML = bmi.toFixed(1);

    metabolic_age[0].innerHTML = answers.age;
    metabolic_age[1].innerHTML = meta_age;

    for(let start=anxiety_factors[0],i=0;i < 4; i++) {
        anxiety_factors_paths[start + i].classList.remove("column-status-0");
        anxiety_factors_paths[start + i].classList.add("column-status-"+(i+1));
    }
    document.querySelectorAll('.anxiety-factors-text').forEach(span=>
        span.innerHTML = anxiety_factors[1].toUpperCase());

    document.querySelector('#energy-metabolism').innerHTML = energy_metabolism;

    console.log(height, weigth, bmi, bmi_goal, bmr, goal_day, bmi_text, meta_age);

    let output = {
        gender : (answers.gender==0?'female':'male'),
        height_cm: height.toFixed(2),
        weigth_kg: weigth.toFixed(2),
        goal_weigth_kg: weigth_goal.toFixed(2),
        weight_unit,
        data : (new Date()).toDateString(),
        bmi : bmi.toFixed(2),
        bmr : bmr.toFixed(2),
        quiz : [],
        name : answers.name,
        email : answers.email
    }
    data.quiz.forEach((q,i)=>{
        output.quiz[i] = {
            question : q.title
        }
        if(typeof answers['q'+i] == "object"){
            output.quiz[i].answer = answers['q'+i].map(a=>q.quest[a].title)
        }else output.quiz[i].answer = q.quest[answers['q'+i]].title;
    })
    if(localStorage)
        localStorage.setItem("data", JSON.stringify(output))
    if(sessionStorage)
        sessionStorage.setItem("data", JSON.stringify(output))
}
function createQuiz(data, index){
    data.forEach((quest,index)=>{
        let article = document.createElement("article"),
            ul = [],
            title = quest.title.toString();
        article.id = "q"+(index);
        article.classList.add("hidden");

        quest.quest.forEach((q,i)=>{
            let li = document.createElement('li'),
                button = document.createElement('button');

            li.classList.add(quest.type);
            if(quest.wrong) li.classList.add("wrong");
            li.id = `q${index}-l-${i}`;
            //button.setAttribute("value", `q${index}-r-${i}`);
            if(quest.input == 1){
                answers["q"+(index)] = false;
                button.addEventListener(buttonEvent,()=>{
                    let previous = li.parentNode.querySelector('.active');
                    answers["q"+(index)] = i;
                    if(previous)
                        if(previous !== li){
                            previous.classList.remove("active");
                        }else
                            answers["q"+(index)] = false;
                    li.classList.toggle("active");
                    validator();
                })
            }else if(quest.input == 0 && typeof quest.correct_input === "number"){
                answers["q"+(index)] = [];
                button.addEventListener(buttonEvent,()=>{
                    if(answers["q"+(index)].includes(i))
                        answers["q"+(index)] = answers["q"+(index)].filter((val)=>val != i);
                    else
                        answers["q"+(index)].push(i);
                    li.classList.toggle("active");
                    if(i == quest.correct_input){
                        answers["q"+(index)] = answers["q"+(index)].filter((val)=>val == quest.correct_input);
                        li.parentNode.querySelectorAll(".active").forEach(l=>l.classList.remove("active"))
                        li.parentNode.children[quest.correct_input].classList.add("active");
                    }else{
                        answers["q"+(index)] = answers["q"+(index)].filter((val)=>val != quest.correct_input);
                        li.parentNode.children[quest.correct_input].classList.remove("active");
                    }
                    console.table(answers['q'+(index)])
                    validator();
                })
            }else{
                answers["q"+(index)] = [];
                button.addEventListener(buttonEvent,()=>{
                    if(answers["q"+(index)].includes(i))
                        answers["q"+(index)] = answers["q"+(index)].filter((val)=>val != i);
                    else
                        answers["q"+(index)].push(i);
                    li.classList.toggle("active");
                    validator();
                })
            }
            button.innerHTML = `${q.img?`<img src="./src/img/${q.img}">`:""}
                            <span>${q.title || ""}</span>
                            ${q.text?`<span class="f-semibold">${q.text}</span>`:""}`

            li.appendChild(button)
            ul.push(li);
        })

        if(typeof quest.title == "object"){
            title = ""
            quest.title.forEach(t=>{
                if(typeof t == "string")
                    title += t;
                else
                    title += `<span class="${"color-"+t.color}">${t.text}</span>`
            })
        }

        article.innerHTML = `
                <span class="title poppins t-center mrg-t-h f-bold">${title}</span>
                <span class="sub-title montserrat t-center mrg-t-l f-light color-5">${quest.descr}</span>
                <ul class="${"grid-"+(quest.grid?3:2)} montserrat f-bold t-center  mrg-t-h">
                </ul>`

        let u = article.querySelector("ul");
        ul.forEach((li)=>u.appendChild(li));

        content.insertBefore(article,insertQuizBefore);
    })
}

changeStates = [
    ()=>{
        //first page
        console.log("removed")
        welcomeArticle.classList.remove("hidden")
        statusBar.classList.add("hidden");
    },
    (way)=>{
        //quiz-questions
        window.scrollTo(0,0);
        document.querySelector("#q"+qNumber).classList.add("hidden");
        qNumber += way;
        changeStatus(qNumber);
        validator = newValidator(quizValidation);
        validator();
        document.querySelector("#q"+qNumber).classList.remove("hidden");
        if(qNumber == 0) statusBarBack.setAttribute("disabled", true);
            else statusBarBack.removeAttribute("disabled")
    },
    ()=>{
        //height & age #2
        window.scrollTo(0,0);
        changeStatus(qNumber);

        answers.system = answers.system || 0;
        validator = newValidator(heightAndAgeValidation, true);
        validator();
        document.querySelector("#q102").classList.add("hidden");
        document.querySelector("#q101").classList.remove("hidden");
    },
    ()=>{
        //weight #3
        let q102 = document.querySelector("#q102");
        document.querySelector("#q101").classList.add("hidden");
        document.querySelector("#q103").classList.add("hidden");
        if(answers.system == 0) {
            q102.querySelector("#weight-kg").classList.add("hidden");
            q102.querySelector("#weight-lbs").classList.remove("hidden");
        }else{
            q102.querySelector("#weight-lbs").classList.add("hidden");
            q102.querySelector("#weight-kg").classList.remove("hidden");
        }
        changeStatus(qNumber);
        validator = newValidator(weightValidation, true);
        validator();
        q102.classList.remove("hidden");
    },
    ()=>{
        //spinner #4
        statusBar.classList.add("hidden");
        document.querySelector("#q102").classList.add("hidden");
        document.querySelector("#q103").classList.remove("hidden");

        window.requestAnimationFrame(function anim(dt){
            if(status >= 50){
                before50.style.setProperty("--spinner-status", 50);
                after50.style.setProperty("--spinner-status", status-50);
            } else {
                before50.style.setProperty("--spinner-status", status);
                after50.style.setProperty("--spinner-status", 0);
            }
            if(status == 100){
                before50.style.setProperty("display", "none");
                after50.style.setProperty("display", "none");
            }
            spinnerStatus.innerText  = `${Math.ceil(status)}%`;
            window.requestAnimationFrame(anim);
        });
        let speed = 0.3,
            currentGoal = 0,
            interval = setInterval(()=>{
            status += speed;
            if(currentGoal < 5 && status >= 20*currentGoal){
                goalList.children[currentGoal].style.setProperty("display", "initial");
                currentGoal++;
            }
            speed = status < 65? speed: speed*1.02;
            if(status >= 100){
                status = 100;
                clearInterval(interval);
                setTimeout(()=>{
                    changeStates[5]();
                }, spinnerWaiting)
                return;
            }
        },spinnerSpeed)
    },
    ()=>{
        //email #5
        document.querySelector("#q103").classList.add("hidden");
        document.querySelector("#q104").classList.remove("hidden");
        validator = newValidator(nameAndEmailValidation, false);
        validator();
    },
    ()=>{
        //final results #6
        document.querySelector("#q104").classList.add("hidden");
        document.querySelector("#q105").classList.remove("hidden");
        document.querySelector("#hello-message").innerText = q104Inputs[1].value;
        getData();
        calcuteResult();
    },
    ()=>{
        window.scrollTo(0,0);
        //link to payment #7
        document.querySelector("#q105").classList.add("hidden");
        document.querySelector("#q106").classList.remove("hidden");
        timer.innerText = `${toDigit(discountTime/60)}:${toDigit(discountTime%60)}`;

        let i = discountTime,
            interval = setInterval(()=>{
            if(i == 0){
                clearInterval(interval);
                document.querySelector('#discount-timer').remove();
                return;
            }
            i--;
            timer.innerText = `${toDigit(i/60)}:${toDigit(i%60)}`;
        }, 1000);
        setTimeout(()=>{
            document.querySelector("#review-status-bar").setAttribute("width","91.5%")
        },10)
    }
]

let maxMoveLenght = 0.05;

let mouse = new Vector(0,0),
    moveables = document.querySelectorAll(".back-moveable");

function toDigit(number){
    number = Math.floor(number);
    return number > 9? number.toString(): "0"+number;
}
function changeStatus(number){
    statusBarStatus.firstElementChild.innerText = `${Math.ceil(qNumber/(data.quiz.length + 2)*100)}%`;
    statusBarLine.style.setProperty("--current-count", number+1);
    Object.values(statusBarLine.children).forEach((li,i)=>{
        if(i < qNumber){
            li.classList.remove("active");
            li.classList.add("deactive");
        }else if(i > qNumber){
            li.classList.remove("active");
            li.classList.remove("deactive");
        }else{
            li.classList.add("active");
            li.classList.remove("deactive");
        }
    })
}

if(moveable){
    window.addEventListener("mousemove",({clientX:x, clientY:y})=>{
        let screenMaxLenght = (window.innerWidth**2 + window.innerHeight**2)**0.5,
            v = [new Vector(moveables[0].offsetLeft + moveables[0].offsetWidth/2, moveables[0].offsetTop + moveables[0].offsetHeight/2),
                new Vector(moveables[1].offsetLeft + moveables[1].offsetWidth/2, moveables[1].offsetTop + moveables[1].offsetHeight/2)],
            mLenght = 0;
        mouse.set(x,y);
        mLenght = mouse.lenght();

        v[0] = mouse.diff(v[0]);
        v[0].len = v[0].lenght();
        v[0].setV(v[0].mul(1/v[0].len).mul(v[0].len*maxMoveLenght));
        v[1] = mouse.diff(v[1]);
        v[1].len = v[1].lenght();
        v[1].setV(v[1].mul(1/v[1].len).mul(v[1].len*maxMoveLenght));
        //v[0] = v[0].mul(v[0].lenght()/screenMaxLenght)
        moveables[0].style.setProperty("--x", Math.floor(v[0].x)+"px");
        moveables[0].style.setProperty("--y", Math.floor(v[0].y)+"px");
        moveables[1].style.setProperty("--x", Math.floor(v[1].x)+"px");
        moveables[1].style.setProperty("--y", Math.floor(v[1].y)+"px");
        //console.log(screenMaxLenght, v[0].len, v[1].len)
    })
}
window.addEventListener('load', ()=>{
    setTimeout(()=>{
        document.getElementById("preloader").remove();},250);
});