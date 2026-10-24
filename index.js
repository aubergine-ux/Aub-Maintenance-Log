const service = document.getElementById('service')
const date = document.getElementById('date')
const mileage = document.getElementById('mileage')
const cost = document.getElementById('cost')
const add = document.getElementById('add')
const cancel = document.getElementById('cancel')
const list = document.getElementById('list')
const notes = document.getElementById('notes')
const search = document.getElementById('search')
const sort = document.getElementById('sort')
const exportBtn = document.getElementById('export')
const importBtn = document.getElementById('import')
const importFile = document.getElementById('import-file')
const services = document.getElementById('services')
const car = document.getElementById('car')
const addCar = document.getElementById('add-car')

const navBtns = document.querySelectorAll('.nav-btn')
const views = document.querySelectorAll('.view')
const stats = document.getElementById('stats')

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        views.forEach(view => view.classList.add('hidden'))
        navBtns.forEach(b => b.classList.remove('active'))

        document.getElementById(btn.dataset.view).classList.remove('hidden')
        btn.classList.add('active')

        if (btn.dataset.view === 'stats') renderStats()
    })
})

const escape = (str) => String(str).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const renderStats = () => {
    const carEntries = entries.filter(e => carOf(e) === car.value)

    if (!carEntries.length) {
        stats.innerHTML = '<p class="empty">No data yet. Log some services first!</p>'
        return
    }

    const total = carEntries.reduce((sum, e) => sum + Number(e.cost || 0), 0)
    const average = total / carEntries.length
    const miles = carEntries.map(e => Number(e.mileage)).filter(m => m)
    const highest = miles.length ? Math.max(...miles) : 0
    const lowest = miles.length ? Math.min(...miles) : 0
    const perMile = highest > lowest ? `$${(total / (highest - lowest)).toFixed(2)}` : '-'

    const byService = {}
    carEntries.forEach(e => {
        byService[e.service] = (byService[e.service] || 0) + Number(e.cost || 0)
    })

    let breakdown = ''
    Object.entries(byService).sort((a, b) => b[1] - a[1]).forEach(([name, spent]) => {
        breakdown += `<div class="stat"><h3>$${spent.toFixed(2)}</h3><p>${escape(name)}</p></div>`
    })

    const byMonth = {}
    carEntries.forEach(e => {
        if (!e.date) return
        byMonth[e.date.slice(0, 7)] = (byMonth[e.date.slice(0, 7)] || 0) + Number(e.cost || 0)
    })

    const most = Math.max(...Object.values(byMonth), 1)
    let months = ''
    Object.keys(byMonth).sort().forEach(month => {
        months += `
            <div class="bar-row">
                <span>${month}</span>
                <div class="bar-track"><div class="bar" style="width: ${byMonth[month] / most * 100}%"></div></div>
                <span>$${byMonth[month].toFixed(2)}</span>
            </div>
        `
    })

    stats.innerHTML = `
        <div class="stat"><h3>${carEntries.length}</h3><p>services logged</p></div>
        <div class="stat"><h3>$${total.toFixed(2)}</h3><p>total spent</p></div>
        <div class="stat"><h3>$${average.toFixed(2)}</h3><p>average per service</p></div>
        <div class="stat"><h3>${highest.toLocaleString()}</h3><p>highest mileage</p></div>
        <div class="stat"><h3>${perMile}</h3><p>cost per mile</p></div>
        ${months ? `<div class="stat months"><p>spending by month</p>${months}</div>` : ''}
        ${breakdown}
    `
}

let entries = JSON.parse(localStorage.getItem('entries')) || []

let cars = JSON.parse(localStorage.getItem('cars')) || ['Aub']

let editing = null

const carOf = (e) => e.car || cars[0]

const save = () => {
    localStorage.setItem('entries', JSON.stringify(entries))
    localStorage.setItem('cars', JSON.stringify(cars))
}

const renderCars = () => {
    const selected = car.value
    car.innerHTML = cars.map(c => `<option value="${escape(c)}">${escape(c)}</option>`).join('')
    car.value = selected || cars[0]
}

const resetForm = () => {
    service.value = ''
    date.value = new Date().toISOString().split('T')[0]
    mileage.value = ''
    cost.value = ''
    notes.value = ''

    editing = null
    add.innerText = 'Add Entry'
    cancel.classList.add('hidden')
}

const clear = document.getElementById('clear')

clear.addEventListener('click', () => {
    if (!confirm(`Clear Entries for ${car.value}?`)) return
    entries = entries.filter(e => carOf(e) !== car.value)
    resetForm()
    save()
    render()
})

date.value = new Date().toISOString().split('T')[0]

mileage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add.click()
})

search.addEventListener('input', () => render())

sort.addEventListener('change', () => render())

cancel.addEventListener('click', () => resetForm())

car.addEventListener('change', () => {
    resetForm()
    render()
    renderStats()
})

addCar.addEventListener('click', () => {
    const name = prompt('Car Name?')
    if (!name || cars.includes(name)) return
    cars.push(name)
    save()
    renderCars()
    car.value = name
    resetForm()
    render()
    renderStats()
})

const csvCell = (str) => `"${String(str || '').replace(/"/g, '""')}"`

exportBtn.addEventListener('click', () => {
    let csv = 'Car,Service,Date,Mileage,Cost,Notes\n'
    entries.filter(e => carOf(e) === car.value).forEach(e => {
        csv += `${csvCell(carOf(e))},${csvCell(e.service)},${e.date},${e.mileage},${e.cost},${csvCell(e.notes)}\n`
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = `${car.value.toLowerCase().replace(/\s+/g, '-')}-maintenance-log.csv`
    link.click()
})

const parseRow = (row) => {
    const values = []
    let value = ''
    let quoted = false

    for (let i = 0; i < row.length; i++) {
        const c = row[i]
        if (quoted && c === '"' && row[i + 1] === '"') {
            value += '"'
            i++
        } else if (c === '"') {
            quoted = !quoted
        } else if (c === ',' && !quoted) {
            values.push(value)
            value = ''
        } else {
            value += c
        }
    }

    values.push(value)
    return values
}

importBtn.addEventListener('click', () => importFile.click())

importFile.addEventListener('change', async () => {
    const file = importFile.files[0]
    if (!file) return

    const lines = (await file.text()).split(/\r?\n/).filter(line => line.trim())
    const headers = parseRow(lines.shift() || '').map(h => h.trim().toLowerCase())
    let added = 0

    lines.forEach(line => {
        const row = {}
        parseRow(line).forEach((value, i) => row[headers[i]] = value)
        if (!row.service) return

        const entry = {
            car: row.car || car.value,
            service: row.service,
            date: row.date || '',
            mileage: row.mileage || '',
            cost: row.cost || '',
            notes: row.notes || ''
        }

        const duplicate = entries.some(e => carOf(e) === entry.car && e.service === entry.service && e.date === entry.date && e.mileage === entry.mileage)
        if (duplicate) return

        if (!cars.includes(entry.car)) cars.push(entry.car)
        entries.push(entry)
        added++
    })

    importFile.value = ''
    save()
    renderCars()
    render()
    alert(`Imported ${added} entries`)
})

const reminders = [
    { name: 'Oil Change', match: 'oil', interval: 5000 },
    { name: 'Tire Rotation', match: 'tire', interval: 7500 },
    { name: 'Air Filter', match: 'air filter', interval: 15000 }
]

const renderReminders = (carEntries) => {
    const current = Math.max(...carEntries.map(e => Number(e.mileage)))
    let html = ''

    reminders.forEach(r => {
        const done = carEntries.filter(e => e.service.toLowerCase().includes(r.match))
        if (!done.length) return

        const due = Math.max(...done.map(e => Number(e.mileage))) + r.interval
        const left = due - current
        const status = left <= 0 ? 'reminder overdue' : 'reminder'

        html += `<p class="${status}">Next ${r.name} due at ${due.toLocaleString()} miles (${left <= 0 ? 'overdue!' : `${left.toLocaleString()} to go`})</p>`
    })

    return html
}

const render = () => {
    let html = ''
    if (sort.value === 'date') entries.sort((a, b) => b.date.localeCompare(a.date))
    else if (sort.value === 'cost') entries.sort((a, b) => b.cost - a.cost)
    else entries.sort((a, b) => b.mileage - a.mileage)
    const carEntries = entries.filter(e => carOf(e) === car.value)
    const total = carEntries.reduce((sum, e) => sum + Number(e.cost || 0), 0)
    const highest = Math.max(...carEntries.map(e => Number(e.mileage)))
    entries.forEach((e, i) => {
        if (carOf(e) !== car.value) return
        if (!e.service.toLowerCase().includes(search.value.toLowerCase())) return
        const highlight = Number(e.mileage) === highest ? 'entry latest' : 'entry'
        html += `
            <div class="${highlight}">
                <div class="entry-info">
                    <h3>${escape(e.service)}</h3>
                    <p>${escape(e.date)} - ${escape(e.mileage)} miles${e.cost ? ` - $${escape(e.cost)}` : ''}</p>
                    ${e.notes ? `<p>${escape(e.notes)}</p>` : ''}
                </div>
                <div class="entry-actions">
                    <button class="edit" data-index="${i}">Edit</button>
                    <button class="delete" data-index="${i}">Delete</button>
                </div>
            </div>
        `
    })
    if (!carEntries.length) html = '<p class="empty">No Entries yet. Add your first Service above!</p>'
    else if (!html) html = '<p class="empty">No Services match your search.</p>'
    list.innerHTML = renderReminders(carEntries) + html + `<p class="count">${carEntries.length} entries logged - $${total.toFixed(2)} spent</p>`

    services.innerHTML = [...new Set(entries.map(e => e.service))].map(s => `<option value="${escape(s)}">`).join('')
}

add.addEventListener('click', () => {
    if (!service.value) return

    const entry = {
        car: car.value,
        service: service.value,
        date: date.value,
        mileage: mileage.value,
        cost: cost.value,
        notes: notes.value
    }

    if (editing) {
        entries[entries.indexOf(editing)] = entry
    } else {
        entries.push (entry)
    }

    save()
    resetForm()
    render()
})

list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete')) {
        if (!confirm('Delete Entry?')) return
        const i = e.target.dataset.index
        if (entries[i] === editing) resetForm()
        entries.splice(i, 1)
        save()
        render()
    } else if (e.target.classList.contains('edit')) {
        const i = e.target.dataset.index
        const entry = entries[i]

        service.value = entry.service
        date.value = entry.date
        mileage.value = entry.mileage
        cost.value = entry.cost || ''
        notes.value = entry.notes

        editing = entry
        add.innerText = 'Save Changes'
        cancel.classList.remove('hidden')
        service.focus()
    }
})

renderCars()
render()
