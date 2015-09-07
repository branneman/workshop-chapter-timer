///////////////////////////////////////////////////////////////////////////////
/// [Pure] Time functions

//  toInt :: * -> Number
var toInt = R.curry(parseInt)(R.__, 10);

//  zeroPad :: String -> String
var zeroPad = R.compose(R.slice(-2, Infinity), R.concat('00'));

//  splitTime :: String -> [Number]
var splitTime = R.compose(R.map(toInt), R.split(':'));

//  parseTime :: String -> Number
var parseTime = function(str) {
    var nums = splitTime(str);
    return R.add(R.multiply(R.head(nums), 60), R.nth(1, nums));
};

//  getTime :: Date -> [Number]
var getTime = function(t) {
    return R.map(zeroPad, [t.getHours(), t.getMinutes(), t.getSeconds()]);
};

//  getTimeHM :: Date -> String
var getTimeHM = R.compose(R.join(':'), R.slice(0, 2), getTime);

//  getTimeHMS :: Date -> String
var getTimeHMS = R.compose(R.join(':'), getTime);

//  percentage :: Number -> Number -> Number -> Number
var percentage = R.curry(function(now, start, end) {
    if (now < start) return 0;
    var result = (now - start) / (end - start) * 100;
    return result > 100 ? 100 : result;
});

//  getTimeDelta :: String -> String -> Number -> Object -> Tuple(Number, Object)
var getTimeDelta = R.curry(function(start, now, offset, chapter) {

    var props = ['talk', 'exercises', 'solutions'];

    var delta = R.compose(R.sum, R.map(R.prop(R.__, chapter)))(props);
    var begin = R.compose(R.add(offset), parseTime)(start);
    var end   = R.add(begin, delta);

    //  chapterIterator :: Object -> String -> Object
    var chapterIterator = function(acc, value) {
        return R.assoc(value, percentage(chapter[value], 0, delta), acc);
    };

    //  getProgress :: Object -> Object
    var setProgress = R.compose(
        R.assoc('current', percentage(now, begin, end)),
        R.reduce(chapterIterator, R.__, props)
    );

    var obj = R.assoc('progress', setProgress({}), chapter);
    return [ R.add(offset, delta), obj ];
});

//  getTimeDeltas :: String -> Date -> [Object] -> [Object]
var getTimeDeltas = function(start, now, chapters) {
    return R.mapAccum(getTimeDelta(start, parseTime(getTimeHM(now))), 0, chapters)[1];
};


///////////////////////////////////////////////////////////////////////////////
/// [Pure] HTML templating

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
        domClock.innerHTML = getTimeHMS(now);
        domChapters.innerHTML = getHTMLChapters(getTimeDeltas(start, now, chapters));
    };
    setInterval(run, 50);

};
