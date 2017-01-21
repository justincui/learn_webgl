/**
 * Created by justincui on 1/21/17.
 */

// our shaders loader
function read_file(pathes, callback) {
    // (C) WebReflection - Mit Style License
    function onreadystatechange() {
        var
            xhr = this,
            i = xhr.i
        ;
        if (xhr.readyState == 4) {
            pathes[i] =  xhr.responseText;
            !--length && typeof callback == "function" && callback(pathes);
        }
    }

    for (var
             pathes = [].concat(pathes),
             asynchronous = !!callback,
             i = pathes.length,
             length = i,
             xhr;
         i--;
    ) {
        (xhr = new XMLHttpRequest).i = i;
        xhr.open("get", pathes[i], asynchronous);
        if (asynchronous) {
            xhr.onreadystatechange = onreadystatechange;
        }
        xhr.send(null);
        onreadystatechange.call(xhr);
    }
    return pathes;
}