const service = document.getElementById('service')
const date = document.getElementById('date')
const mileage = document.getElementById('mileage')
const cost = document.getElementById('cost')
const add = document.getElementById('add')
const list = document.getElementById('list')
const notes = document.getElementById('notes')

let entries = JSON.parse(localStorage.getItem('entries')) || []

let editingIndex = null

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

date.value = new Date().toISOString().split('T')[0]

mileage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add.click()
})

const render = () => {
    let html = ''
    entries.sort((a, b) => b.mileage - a.mileage)
    const total = entries.reduce((sum, e) => sum + Number(e.cost || 0), 0)
    entries.forEach((e, i) => {
        const highlight = i === 0 ? 'entry latest' : 'entry'
        html += `
            <div class="${highlight}">
                <div class="entry-info">
                    <h3>${e.service}</h3>
                    <p>${e.date} - ${e.mileage} miles${e.cost ? ` - $${e.cost}` : ''}</p>
                    ${e.notes ? `<p>${e.notes}</p>` : ''}
                </div>
                <div class="entry-actions">
                    <button class="edit" data-index="${i}">Edit</button>
                    <button class="delete" data-index="${i}">Delete</button>
                </div>
            </div>
        `
    })
    if (!entries.length) html = '<p class="empty">No Entries yet. Add your first Service above!</p>'
    list.innerHTML = html + `<p class="count">${entries.length} entries logged - $${total.toFixed(2)} spent</p>`
}

add.addEventListener('click', () => {
    if (!service.value) return

    if (editingIndex !== null) {
        entries[editingIndex] = {
            service: service.value,
            date: date.value,
            mileage: mileage.value,
            cost: cost.value,
            notes: notes.value
        }
        editingIndex = null
        add.innerText = 'Add Entry'
    } else {
        entries.push ({
            service: service.value,
            date: date.value,
            mileage: mileage.value,
            cost: cost.value,
            notes: notes.value
        })
    }

    save()
    render()

    service.value = ''
    date.value = ''
    mileage.value = ''
    cost.value = ''
    notes.value = ''
})

list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete')) {
        const i = e.target.dataset.index
        entries.splice(i, 1)
        save()
        render()
    } else if (e.target.classList.contains('edit')) {
        const i = e.target.dataset.index
        const entry = entries[i]

        service.value = entry.service
        date.value = entry.data
        mileage.service = entry.mileage
        cost.value = entry.clost || ''
        notes.value = entry.notes

        editingIndex = i
        add.innerText = 'Save Changes'
        service.focus()
    }
})

render()