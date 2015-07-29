///////////////////////////////////////////////////////////////////////////////
/// [Pure] Time functions

//  toInt :: * -> Number
var toInt = R.partial(R.flip(R.curry(parseInt)), 10);

//  zeroPad :: String -> String
var zeroPad = R.compose(R.slice(-2, Infinity), R.concat('00'));

//  splitTime :: String -> [Number]
var splitTime = R.compose(R.map(toInt), R.split(':'));

//  parseTime :: String -> Number
var parseTime = function(str) {
    var nums = splitTime(str);
    return R.add(R.multiply(R.head(nums), 60), R.nth(1, nums));
};

//  stringifyTime :: Date -> String
var stringifyTime = function(t) {
    var h = zeroPad(t.getHours());
    var m = zeroPad(t.getMinutes());
    return R.join(':', [h, m]);
};

//  percentage :: Number -> Number -> Number -> Number
var percentage = function(now, start, end) {
    if (now < start) return 0;
    var result = (now - start) / (end - start) * 100;
    return result > 100 ? 100 : result;
};

//  getTimeDelta :: String -> String -> Number -> Object -> Tuple(Number, Object)
var getTimeDelta = R.curry(function(start, now, offset, chapter) {

    var delta = chapter.talk + chapter.exercises + chapter.solutions;
    var begin = offset + parseTime(start);
    var end   = begin + delta;

    var obj = R.merge(chapter, {
        progress: {
            talk:      percentage(chapter.talk,      0, delta),
            exercises: percentage(chapter.exercises, 0, delta),
            solutions: percentage(chapter.solutions, 0, delta),
            current:   percentage(now, begin, end)
        }
    });

    return [offset + delta, obj];
});

//  getTimeDeltas :: String -> Date -> [Object] -> [Object]
var getTimeDeltas = function(start, now, chapters) {
    return R.mapAccum(getTimeDelta(start, parseTime(stringifyTime(now))), 0, chapters)[1];
};

//  getClock :: Date -> String
var getClock = function(t) {
    var h = zeroPad(t.getHours());
    var m = zeroPad(t.getMinutes());
    var s = zeroPad(t.getSeconds());
    return R.join(':', [h, m, s]);
};


///////////////////////////////////////////////////////////////////////////////
/// [Pure] HTML generation

//  getHTMLDiv :: String -> String -> String -> String
var getHTMLDiv = function(cn, perc, i) {
    return '<div class="{c}" style="width:{p}%">{i}</div>'
        .replace('{c}', cn)
        .replace('{p}', perc)
        .replace('{i}', i);
};

//  getHTMLChapter :: Object -> String
var getHTMLChapter = function(chapter) {
    var talk      = getHTMLDiv('talk', chapter.progress.talk, chapter.talk);
    var exercises = getHTMLDiv('exercises', chapter.progress.exercises, chapter.exercises);
    var solutions = getHTMLDiv('solutions', chapter.progress.solutions, chapter.solutions);
    var bar       = getHTMLDiv('bar', chapter.progress.current, '');
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
        domClock.innerHTML = getClock(now);
        domChapters.innerHTML = getHTMLChapters(getTimeDeltas(start, now, chapters));
    };
    setInterval(run, 50);

};
