const n = 5

const words = new Set()
const largewords = new Set()

let smalldone = false
fetch('dict/dict.txt')
  .then(response => response.text())
  .then(data => {
    const lst = data.split("\n")
    const hashStr = str => {
      let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
      h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
      return 4294967296 * (2097151 & h2) + (h1>>>0);
    }
    lst.sort((i,j)=>hashStr(i)-hashStr(j))
    for (let word of lst) {
      if (word.length == 5) {
        words.add(word.toUpperCase())
      }
    }
    // console.log([...words])
    smalldone = true
  });

let largedone = false
fetch('dict-large/dict5.txt')
  .then(response => response.text())
  .then(data => {
    for (let word of data.split("\n")) {
      if (word.length == 5) {
        largewords.add(word.toUpperCase())
      }
    }
    largedone = true
  });

const getSetFromWord = w => {
  const cnts = {}
  const s = new Set()
  for (let c of w) {
    if (c in cnts) {
      cnts[c]++
      s.add(c+cnts[c])
    } else {
      cnts[c] = 1
      s.add(c+1)
    }
  }
  return s
}
const getWordFromSet = s => {
  const l = [...s]
  l.sort()
  return l.map(i=>i[0]).join("")
}
const intersection = (s1,s2) => {
  return [...s1].filter(i => s2.has(i)).length
}

const dsmall = {}
const d = {}
const out = []
const outlarge = []
const getLeft = (w,x,oldout) => {
  const newout = []
  let cnt = 0
  for (let st of oldout) {
    if (intersection(w,st) == x) {
      newout.push(st)
      cnt += d[getWordFromSet(st)].length
    }
  }
  return {"out": newout, "cnt": cnt}
}
const getBestWord = (commout,x,index,fullout) => {
  // if (index in toload) {
  // }
  const best = []
  let k = 1
  let samp = _.sampleSize(commout,0)
  samp = samp.concat(_.sampleSize(fullout,1000-samp.length))
  // let samp = fullout
  // console.log(samp)
  const samp2 = _.sampleSize(commout,2000)
  const l = samp.length
  for (let mystring of samp) {
    console.log(k+"/"+l,getWordFromSet(mystring))
    k++
    let tot = 0
    const counts = Array(n+1).fill(0)
    for (let poss of samp2) {
      // console.log("test",mystring,poss,intersection(mystring,poss))
      counts[intersection(mystring,poss)] += d[getWordFromSet(poss)].length
    }
    // console.log(mystring,counts)
    for (let i = 0; i < n+1; i++) {
      const {out,cnt} = getLeft(mystring,i,samp2)
      tot += counts[i]*cnt
    }
    best.push([tot,mystring])
  }
  console.log("")
  best.sort()
  return best.map(i => {
    const w = getWordFromSet(i[1])
    return [i[0],(w in dsmall) ? dsmall[w] : d[w]]
  })
}

const init = () => {
  for (let w of words) {
    const l = w.split("")
    l.sort()
    const neww = l.join("")
    if (neww in dsmall) {
      dsmall[neww].push(w)
    } else {
      dsmall[neww] = [w]
    }
  }
  for (let w of largewords) {
    const l = w.split("")
    l.sort()
    const neww = l.join("")
    if (neww in d) {
      d[neww].push(w)
    } else {
      d[neww] = [w]
    }
  }
  for (let key of Object.keys(dsmall)) {
    out.push(getSetFromWord(key))
  }
  for (let key of Object.keys(d)) {
    outlarge.push(getSetFromWord(key))
  }
}

let loaded = false
let done = false
let compword = ""

const getRandWord = () => {
  const date = new Date()
  const idx = (Math.floor(date.getTime() / 1000) + date.getDate()**2) % words.size
  return [...words][idx]
}

const interval = setInterval(() => {
  // console.log("loaded",loaded)
  if (smalldone && largedone && !loaded) {
    init()
    clearInterval(interval)
    // console.log(getBestWord(out,1,1,outlarge))
    loaded = true
    const section = document.querySelector('.section')
    section.style.visibility = "visible"
    const input = document.querySelector(".first");
    input.focus()
    // compword = _.sample([...words])
    compword = getRandWord()
    console.log(compword)
  }
},100)

document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll(".letter")
  const force = document.getElementById("force")
  const table = document.getElementById("history")

  for (let i = 0; i < n; i++) {
    const input = inputs[i]
    input.addEventListener("keydown", event => {
      const c = event.key
      if (event.metaKey) {
        return
      }
      event.preventDefault();
      if (!done) {
        force.style.visibility = "hidden"
      }
      if (event.key === "Enter") {
        click(false)
      } else if ("qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM".split("").includes(c)) {
        input.value = c.toUpperCase()
        if (i < n-1) {
          inputs[i+1].focus()
        }
      } else if (c === "ArrowLeft") {
        if (i > 0) {
          inputs[i-1].focus()
        }
      } else if (c === "ArrowRight") {
        if (i < n-1) {
          inputs[i+1].focus()
        }
      } else if (c === "Delete" || c === "Backspace") {
        if (input.value == "") {
          if (i > 0) {
            inputs[i-1].value = ""
            inputs[i-1].focus()
          }
        } else {
          input.value = ""
        }
      }
    })
    input.addEventListener("animationend", function () {
      this.classList.remove('error')
      this.classList.remove('good')
    })
  }

  const reset = () => {
    // compword = _.sample([...words])
    compword = getRandWord()
    console.log(compword)
    table.innerHTML = ""
    const win = document.getElementById("win")
    win.innerHTML = ""
    win.style.paddingTop = "12px"
    done = false
    for (let input of inputs) {
      input.value = ""
      input.classList.remove("win");
    }
    inputs[0].focus()
    force.style.visibility = "hidden"
    force.innerHTML = "force?"
  }

  force.addEventListener("click", () => {
    if (done) {
      reset()
    } else {
      click(true)
    }
  })

  const click = forced => {
    if (!loaded || done) {
      return
    }
    force.style.visibility = "hidden"
    const w = [...inputs].map(i=>i.value).join("").toUpperCase()
    if (w.length != 5 || (!(largewords.has(w)) && !forced)) {
      for (let input of inputs) {
        input.classList.remove("error");
        input.classList.remove("good");
        void input.offsetWidth;
        input.classList.add("error");
      }
      if (w.length == 5) {
        force.style.visibility = "visible"
      }
      return
    }
    for (let input of inputs) {
      input.classList.remove("error");
      input.classList.remove("good");
      void input.offsetWidth;
      input.classList.add("good");
    }
    inputs[0].focus()
    const row = table.insertRow(0)
    row.insertCell(0).innerHTML = w
    row.insertCell(1).innerHTML = intersection(getSetFromWord(w),getSetFromWord(compword))
    if (w == compword) {
      const win = document.getElementById("win")
      win.innerHTML = "YOU WIN! Score: "+table.rows.length
      win.style.paddingTop = "20px"
      for (let input of inputs) {
        input.classList.remove("error");
        input.classList.remove("good");
        input.classList.add("win");
      }
      inputs[0].blur()
      done = true
      force.innerHTML = "again?"
      force.style.visibility = "visible"
    }
    // console.log(getLeft(getSetFromWord(input.value),1,out))
  }
})
