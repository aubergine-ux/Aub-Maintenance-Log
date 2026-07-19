const service = document.getElementById('service')
const date = document.getElementById('date')
const mileage = document.getElementById('mileage')
const add = document.getElementById('add')
const list = document.getElementById('list')

let entries = JSON.parse(localStorage.getItem('entries')) || []

const save = () => {
    localStorage.setItem('entries', JSON.stringify(entries))
}
const clear = document.getElementById('clear')

clear.addEventListener('click', () => {
    if (!confirm('Clear Entries?')) return
    entries = []
    save()
    render()
})

const render = () => {
    let html = ''
    entries.sort((a, b) => b.mileage - a.mileage)
    entries.forEach((e, i) => {
        html += `
            <div class="entry">
                <div class="entry-info">
                    <h3>${e.service}</h3>
                    <p>${e.date} - ${e.mileage} miles</p>
                </div>
                <button class="delete" data-index="${i}">Delete</button>
            </div>
        `
    })
    list.innerHTML = html + `<p class="count">${entries.length} entries logged</p>`
}

add.addEventListener('click', () => {
    if (!service.value) return

    entries.push ({
        service: service.value,
        date: date.value,
        mileage: mileage.value
    })

    save()
    render()

    service.value = ''
    date.value = ''
    mileage.value = ''
})

list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete')) {
        const i = e.target.dataset.index
        entries.splice(i, 1)
        save()
        render()
    }
})

render()