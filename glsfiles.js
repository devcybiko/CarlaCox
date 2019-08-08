const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
    /**
     * simplistic CSV reader
     * @param {} pagesCSVFname 
     */
    readCSVFile: function (pagesCSVFname) {
        var lines = this.readListFile(pagesCSVFname);
        var header = [];
        var rows = [];
        for (const i in lines) {
            var line = lines[i];
            var cols = line.split(',');
            if (i == 0) {
                header = cols;
                continue;
            }
            var row = [];
            for (const i in header) {
                row[header[i]] = cols[i];
            }
            rows.push(row);
        }
        return rows;
    },

    // reads a file removing all comments (#) and blank lines
    // and converts each line to a regexp
    readRegExpFile: function (fname) {
        var lines = this.readListFile(fname);
        var rows = [];
        for (const i in lines) {
            var line = lines[i];
            var regexp = new RegExp(line, "i");
            console.log(regexp);
            rows.push(regexp);
        }
        return rows;
    },

    /**
     *  reads a file removing all comments (#) and blank lines
     */
    readListFile: function (fname) {
        var lines = this.readTextFile(fname);
        var rows = [];
        for (const i in lines) {
            var line = lines[i];
            if (line.substring(0, 1) === '#') continue;
            if (line.length === 0) continue;
            rows.push(line);
        }
        return rows;
    },

    /**
     * read a text file as an array of strings
     */
    readTextFile: function (fname) {
        var text = this.readFile(fname);
        var textByLine = text.split("\n");
        return textByLine;
    },

    /**
     * read a text file as one long string
     */
    readFile: function (fname) {
        var text = fs.readFileSync(fname).toString('utf-8');
        return text;
    },

    /**
     * write an array of strings to a text file
     */

    writeTextFile: function (fname, list) {

        var buffer = new Buffer.from(list.join('\n'));

        fs.open(fname, 'w', function (err, fd) {
            if (err) {
                throw 'error opening file: ' + err;
            }

            fs.write(fd, buffer, 0, buffer.length, null, function (err) {
                if (err) throw 'error writing file: ' + err;
                fs.close(fd, function () {
                    //console.log('file written');
                })
            });
        });
    },
    writeFile: function (fname, str) {

        var buffer = new Buffer.from(str);

        fs.open(fname, 'w', function (err, fd) {
            if (err) {
                throw 'error opening file: ' + err;
            }

            fs.write(fd, buffer, 0, buffer.length, null, function (err) {
                if (err) throw 'error writing file: ' + err;
                fs.close(fd, function () {
                    //console.log('file written');
                })
            });
        });
    },

    /**
     * run the command and return the stdout
     * if there's an error, returns stderr
     */
    run: function (cmd) {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                return stderr;
            }
            return stdout;
        });
    }
}
