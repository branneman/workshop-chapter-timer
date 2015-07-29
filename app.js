///////////////////////////////////////////////////////////////////////////////
/// [Pure] Time functions

//  toNumber :: String -> Number -> Number
var toNumber = R.flip(R.curry(parseInt));

//  toInt :: * -> Number
var toInt = toNumber(10);

//  zeroPad :: String -> String
var zeroPad = R.compose(R.slice(-2, Infinity), R.concat('00'));

//  timeToMinutes :: String -> Number
var timeToMinutes = function(str) {
    var nums = R.map(toInt, R.split(':', str)); // @todo compose
    return (nums[0] * 60) + nums[1];
};

//  minutesToTime :: Number -> String
var getHours = R.partial(R.flip(R.divide), 60);
var getMinutes = R.partial(R.flip(R.modulo), 60);
var minutesToTime = function(num) {
    var h = R.compose(zeroPad, toInt, getHours);
    var m = R.compose(zeroPad, getMinutes);
    return h(num) + ':' + m(num);
};

//  getTime :: Date -> String
var getTime = function(t) {
    var h = zeroPad(t.getHours());
    var m = zeroPad(t.getMinutes());
    return R.join(':', [h, m]);
};

// get(540, 500, 600) -> 40%
var getMinMaxPercentage = function(now, start, end) {
    if (now < start) return 0;
    var result = (now - start) / (end - start) * 100;
    return result > 100 ? 100 : result;
};

//  getTimeDelta :: Date -> Date -> Number -> Object -> Object
var getTimeDelta = function(startDate, nowDate, offset, chapter) {

    var delta = chapter.talk + chapter.exercises + chapter.solutions;
    var now   = timeToMinutes(getTime(nowDate));
    var start = offset + timeToMinutes(startDate);
    var end   = start + delta;

    return {
        title: chapter.title,
        progress: {
            talk: getMinMaxPercentage(chapter.talk, 0, delta),
            exercises: getMinMaxPercentage(chapter.exercises, 0, delta),
            solutions: getMinMaxPercentage(chapter.solutions, 0, delta),
            current: getMinMaxPercentage(now, start, end)
        },
        offset: delta
    };
};

//  getTimeDeltas :: Date -> Date -> [Object] -> [Object]
var getTimeDeltas = function(start, now, chapters) {
    var offset = 0;
    var newChapters = [];
    chapters.forEach(function(chapter) {
        var newChapter = getTimeDelta(start, now, offset, chapter);
        newChapters.push(newChapter);
        offset += newChapter.offset;
    });
    return newChapters;
};


///////////////////////////////////////////////////////////////////////////////
/// [Pure] HTML generation

//  getHTMLDiv :: String -> String -> String
var getHTMLDiv = function(cn, perc) {
    return '<div class="{c}" style="width:{p}%"></div>'
        .replace('{c}', cn)
        .replace('{p}', perc);
};

//  getHTMLChapter :: Object -> String
var getHTMLChapter = function(chapter) {
    var talk      = getHTMLDiv('talk', chapter.progress.talk);
    var exercises = getHTMLDiv('exercises', chapter.progress.exercises);
    var solutions = getHTMLDiv('solutions', chapter.progress.solutions);
    var bar       = getHTMLDiv('bar', chapter.progress.current);
    var progress  = '<div class="progress">' + talk + exercises + solutions + bar + '</div>';
    var title     = '<div class="title">' + chapter.title + '</div>';
    var li        = '<li>' + progress + title + '</li>';
    return li;
};

//  getHTMLChapters :: [Object] -> String
var getHTMLChapters = R.compose(R.join(''), R.map(getHTMLChapter));


///////////////////////////////////////////////////////////////////////////////
/// [Impure] Application

var app = function(start, chapters) {

    var domClock    = document.querySelector('.clock');
    var domChapters = document.querySelector('.chapters');

    var run = function() {
        var now = new Date;
        domClock.innerHTML = getTime(now);
        domChapters.innerHTML = getHTMLChapters(getTimeDeltas(start, now, chapters));
    };
    run();
    //setInterval(run, 50);

};
