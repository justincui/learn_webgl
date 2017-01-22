function* read_file() {
    let args=[...arguments];
    for (let path of args) {
        yield new Promise(function (resolve, reject) {
            const xhr_path=path;
            let xhr = new XMLHttpRequest();
            xhr.open("get", xhr_path, true);
            //console.log("get ", xhr_path);
            xhr.onreadystatechange = (oEvent) => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                        //console.log("output:",xhr_path,' = ', xhr.responseText);
                    } else {
                        reject(xhr.statusText);
                    }
                }
            };
            xhr.send(null);
        });
    }

}