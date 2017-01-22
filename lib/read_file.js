function* read_file() {
    var args=[...arguments];
    for (let path of args) {
        yield new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("get", path, true);
            xhr.onreadystatechange = (oEvent) => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject(xhr.statusText);
                    }
                }
            };
            xhr.send(null);
        });
    }

}