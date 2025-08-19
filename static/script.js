const app = {
            state: {
                totalIntakeMl: 0, totalIntakeKcal: 0, totalLossMl: 0, netBalanceMl: 0, cumulativeBalanceMl: 0,
                weightDifferenceKg: 0, totalDiuresisMl: 0, totalPerspiratioMl: 0, totalOtherLossMl: 0,
                dailyWeight: 0, height: 0, gender: '', isUnder15: 'no', maxTemp: 37.0, breathingSupport: 'standard',
                mainAppStartTime: '06:00', mainAppEndTime: '06:00',
                patientDate: '', patientTimePeriod: '', patientLocation: '', initialWeight: 0, idealWeight: 0,
                adjustedWeight: false,
                avgHourlyDiuresis: 0,
                perspiratioWarning: '',
                medicineCategoryTotals: { Sedering: 0, Antibiotika: 0, Vasoaktiva: 0, Övrigt: 0 },
                kcalSummary: { peroralt: 0, sondmat: 0, tpn: 0, ivMedicine: 0, intravenousTotal: 0 }
            },
            counters: { fluid: 0, medicine: 0, bloodProduct: 0, tpnSondmat: 0, loss: 0 },
            config: {
                fluid: {
                    containerId: 'fluidEntriesContainer',
                    template: (id) => `<div class="fluid-entry-row" data-id="${id}" data-type="fluid"><div class="grid-item"><select class="select-main"></select><input type="text" class="custom-input" placeholder="Ange övrig vätska" style="display: none;"></div><div class="grid-item"><input type="text" class="ml-input" value="0" placeholder="=50+50"></div><div class="grid-item"><input type="text" class="kcal-output" value="0" placeholder="=10*1.1"></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
                    populateSelect: (select) => app.populateSelect(select, 'fluid')
                },
                medicine: {
                    containerId: 'medicineEntriesContainer',
                    template: (id) => `<div class="fluid-entry-row" data-id="${id}" data-type="medicine"><div class="grid-item"><select class="select-main"></select><input type="text" class="custom-input" placeholder="Ange övrigt läkemedel" style="display: none;"></div><div class="grid-item"><input type="text" class="ml-input" value="0" placeholder="=50+50"></div><div class="grid-item"><input type="text" class="kcal-output" value="0" placeholder="=10*1.1"></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
                    populateSelect: (select) => app.populateSelect(select, 'medicine')
                },
                bloodProduct: {
                    containerId: 'bloodProductEntriesContainer',
                    template: (id) => `<div class="blood-product-entry-row" data-id="${id}" data-type="bloodProduct"><div class="grid-item"><select class="select-main"></select></div><div class="grid-item"><input type="text" class="ml-input" value="0" placeholder="=50+50"></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
                    populateSelect: (select) => app.populateSelect(select, 'bloodProduct')
                },
                tpnSondmat: {
                    containerId: 'tpnSondmatEntriesContainer',
                    template: (id) => `<div class="tpn-sondmat-entry-row" data-id="${id}" data-type="tpnSondmat"><div class="grid-item"><select class="select-main"></select><input type="text" class="custom-input" placeholder="Ange övrig sondmat" style="display: none;"></div><div class="grid-item"><input type="text" class="ml-input" value="0" placeholder="=50+50"></div><div class="grid-item"><input type="text" class="kcal-output" value="0" placeholder="=10*1.1"></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
                    populateSelect: (select) => app.populateSelect(select, 'tpnSondmat')
                },
                loss: {
                    containerId: 'lossEntriesContainer',
                    template: (id) => `<div class="loss-entry-row" data-id="${id}" data-type="loss"><div class="grid-item"><select class="select-main"></select><input type="text" class="custom-input" placeholder="Ange annan förlust" style="display: none;"></div><div class="grid-item"><input type="text" class="ml-input" value="0" placeholder="=50+50"></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
                    populateSelect: (select) => app.populateSelect(select, 'loss')
                }
            },
            data: {
                fluid: {
                    placeholder: 'Välj vätska', customOption: 'Övrig vätska',
                    categories: {
                        "Glucos utan elektrolyter": [{ name: "Glukos 25 mg/ml", kcal: 0.1 }, { name: "Glukos 50 mg/ml", kcal: 0.2 }, { name: "Glukos 100 mg/ml", kcal: 0.4 }, { name: "Glukos 200 mg/ml", kcal: 0.8 }, { name: "Glukos 300 mg/ml", kcal: 1.2 }],
                        "Kolloider": [{ name: "Albumin 20%", kcal: 0.8 }, { name: "Albumin 5%", kcal: 0 }],
                        "Kristalloider med elektrolyter": [{ name: "Glukos 100 mg/ml med el", kcal: 0.4 }, { name: "Glukos 50 mg/ml med El", kcal: 0.2 }, { name: "NaCl Picco-Kalibrering", kcal: 0 }, { name: "Natriumbikarbonat 50 mg/ml", kcal: 0 }, { name: "Natriumklorid 9 mg/ml", kcal: 0 }, { name: "Natriumklorid hyperton", kcal: 0 }, { name: "Plasmolyte", kcal: 0 }, { name: "Ringer-Acetat", kcal: 0 }]
                    }
                },
                medicine: {
                    placeholder: 'Välj läkemedelsvätska', customOption: 'Övrigt läkemedel', customOption2: 'Övrig Antibiotika',
                    categories: {
                        "Sedering": [{ name: "Dexdor", kcal: 0 }, { name: "Esketamin", kcal: 0 }, { name: "Klonidin", kcal: 0 }, { name: "Midazolam", kcal: 0 }, { name: "Propofol 10mg/ml", kcal: 1.1 }, { name: "Propofol 20mg/ml", kcal: 1.33 }, { name: "Remifentanil", kcal: 0 }],
                        "Antibiotika": [{ name: "Pip/Taz 4g x 3", kcal: 0, defaultMl: 60 }, { name: "Övrig Antibiotika", kcal: 0 }, { name: "Kaspofungin", kcal: 0, defaultMl: 250 }],
                        "Vasoaktiva": [{ name: "Adrenalin", kcal: 0 }, { name: "Argipressin", kcal: 0 }, { name: "Dobutamin", kcal: 0 }, { name: "Levosimendan", kcal: 0.2 }, { name: "Milrinon", kcal: 0 }, { name: "Noradrenalin", kcal: 0 }],
                        "Övrigt": [{ name: "Amiodarone", kcal: 0.2 }, { name: "EDA", kcal: 0 }, { name: "Kalium/Kaliumklorid", kcal: 0 }, { name: "Lispro", kcal: 0 }, { name: "Paracetamol", kcal: 0 }]
                    }
                },
                bloodProduct: { placeholder: 'Välj blodprodukt', options: ['Erytrocyter', 'Trombocyter', 'Plasma'] },
                tpnSondmat: {
                    placeholder: 'Välj TPN/Sondmat/Peroralt', customOption: 'Sondmat övrig',
                    options: [{ name: "Peroralt intag", kcal: 0 }],
                    categories: {
                        "TPN/Sondmat": [{ name: "Vatten i sond", kcal: 0 }, { name: "Sondmat övrig", kcal: 0 }, { name: "Smof Kabiven 900 kcal extra nitrogen", kcal: 0.9 }, { name: "Smof Kabiven 1100 kcal", kcal: 1.12 }, { name: "Smof Kabiven PI 1300 kcal", kcal: 0.68 }, { name: "Smof Kabiven 1350 kcal extra nitrogen", kcal: 0.9 }, { name: "Smof Kabiven 1600 kcal", kcal: 1.08 }, { name: "Smof Kabiven 1800 extra nitrogen", kcal: 1.1 }, { name: "Smof Kabiven 2200 kcal", kcal: 1.12 }, { name: "Sondmat Fresubin 2 kcal HP", kcal: 2.0 }, { name: "Sondmat Fresubin Original", kcal: 1 }, { name: "Sondmat Isosource standardfibre", kcal: 1 }]
                    }
                },
                loss: { placeholder: 'Välj förlusttyp', customOption: 'Annan förlust', options: ['Avföring', 'Blödning', 'Dialys (CRRT)', 'Dialys (IHD)', 'Diures', 'Drän 1', 'Drän 2', 'Drän 3', 'Kräkning', 'Sond', 'Stomi', 'Thoraxdrän hö', 'Thoraxdrän vä', 'VAC-pump'] }
            },
            init() {
                this.cacheDOMElements();
                this.bindEvents();
                this.setDefaultValues();
                this.addInitialRows();
                this.checkInitialInputColors();
                this.updateAllCalculations();
            },
            cacheDOMElements() {
                this.dom = {
                    body: document.body,
                    dateInput: document.getElementById('dateInput'),
                    otherLocationInput: document.getElementById('otherLocationInput'),
                    loadFromFileInput: document.getElementById('loadFromFileInput'),
                    perspiratioWarning: document.getElementById('perspiratioWarning'),
                    containers: {
                        fluid: document.getElementById('fluidEntriesContainer'),
                        medicine: document.getElementById('medicineEntriesContainer'),
                        bloodProduct: document.getElementById('bloodProductEntriesContainer'),
                        tpnSondmat: document.getElementById('tpnSondmatEntriesContainer'),
                        loss: document.getElementById('lossEntriesContainer'),
                    },
                    summary: {
                        totalIntakeMl: document.getElementById('totalIntakeMl'),
                        totalIntakeKcal: document.getElementById('totalIntakeKcal'),
                        totalLossMl: document.getElementById('totalLossMl'),
                        netBalanceMl: document.getElementById('netBalanceMl'),
                        cumulativeBalanceMl: document.getElementById('cumulativeBalanceMl'),
                        weightDifferenceKg: document.getElementById('weightDifferenceKg'),
                        avgHourlyDiuresis: document.getElementById('avgHourlyDiuresis'),
                    }
                };
            },
            setDefaultValues() {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                this.dom.dateInput.value = yesterday.toISOString().split('T')[0];
            },
            addInitialRows() {
                ['fluid', 'medicine', 'bloodProduct', 'tpnSondmat'].forEach(type => this.addRow(type, { isInitial: true }));
                this.addRow('loss', { selectValue: 'Diures', isInitial: true }); // Add Diures by default
                this.addRow('loss', { isInitial: true }); // Add one empty loss row
            },
            checkInitialInputColors() {
                document.querySelectorAll('.important-input, .filled-input').forEach(input => {
                    this.updateInputColor(input);
                });
            },
            updateInputColor(inputElement) {
                const hasValue = inputElement.value.trim() !== '' && (inputElement.id !== 'dailyWeight' || inputElement.value.trim() !== '0');
                if (hasValue) {
                    inputElement.classList.add('filled-input');
                    inputElement.classList.remove('important-input');
                } else {
                    inputElement.classList.remove('filled-input');
                    inputElement.classList.add('important-input');
                }
            },
            bindEvents() {
                this.dom.body.addEventListener('click', this.handleDelegatedClick.bind(this));
                const mainContent = document.querySelector('body');
                mainContent.addEventListener('input', this.handleFormInput.bind(this));
                mainContent.addEventListener('change', this.handleFormInput.bind(this));
                mainContent.addEventListener('blur', (e) => {
                    if (e.target.matches('input[type="text"]')) this.handleFormulaInput(e);
                }, true);
                mainContent.addEventListener('keydown', (e) => {
                    if (e.target.matches('input[type="text"]') && e.key === 'Enter') {
                        e.preventDefault();
                        this.handleFormulaInput(e);
                        e.target.blur();
                    }
                });
                this.dom.loadFromFileInput.addEventListener('change', this.loadDataFromFile.bind(this));
            },
            handleDelegatedClick(e) {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                const { action, target: targetId, delta, type } = target.dataset;
                switch (action) {
                    case 'setNow': this.setNow(targetId); break;
                    case 'changeNumber': this.changeNumber(targetId, parseInt(delta, 10)); break;
                    case 'addRow': this.addRow(type); break;
                    case 'removeRow':
                        target.closest('[data-id]').remove();
                        this.updateAllCalculations();
                        break;
                    case 'transferPerspiratio': this.transferPerspiratioToLoss(); break;
                    case 'openModal': this.openModal(targetId); break;
                    case 'closeModal': this.closeModal(targetId); break;
                    case 'save': this.saveDataToFile(); break;
                    case 'load': this.dom.loadFromFileInput.click(); break;
                    case 'print': window.print(); break;
                    case 'resetAll': this.resetAll(); break;
                }
            },
            handleFormInput(e) {
                const target = e.target;
                if (target.matches('.important-input, .filled-input')) {
                    this.updateInputColor(target);
                }
                if (target.id === 'bedSelect') {
                    this.dom.otherLocationInput.style.display = target.value === 'Annan plats' ? 'block' : 'none';
                }
                const row = target.closest('[data-id]');
                if (row) {
                    const kcalOutput = row.querySelector('.kcal-output');
                    if (kcalOutput) {
                        if (target.classList.contains('kcal-output')) {
                            kcalOutput.dataset.manualOverride = 'true';
                        } else if (target.classList.contains('select-main') || target.classList.contains('ml-input')) {
                            kcalOutput.dataset.manualOverride = 'false';
                        }
                    }
                    if (target.classList.contains('select-main')) {
                        const customInput = row.querySelector('.custom-input');
                        if (customInput) {
                            const configData = this.data[row.dataset.type];
                            const showCustom = target.value === configData.customOption || (configData.customOption2 && target.value === configData.customOption2);
                            customInput.style.display = showCustom ? 'block' : 'none';
                        }
                        // NYTT: Sätt default-värde för Pip/Taz
                        const selectedOption = target.options[target.selectedIndex];
                        const defaultMl = selectedOption.dataset.defaultMl;
                        const mlInput = row.querySelector('.ml-input');
                        if (defaultMl && mlInput) {
                            mlInput.value = defaultMl;
                        }
                    }
                }
                this.updateAllCalculations();
            },
            handleFormulaInput(event) {
                const input = event.target;
                let value = input.value.trim();
                if (!value.startsWith('=')) return;
                const expression = value.substring(1);
                if (expression === '') return;
                try {
                    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
                        console.warn(`Invalid characters in formula: "${expression}"`);
                        return;
                    }
                    const result = new Function(`return ${expression}`)();
                    if (typeof result === 'number' && !isNaN(result)) {
                        input.value = Math.round(result);
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                } catch (e) {
                    console.error(`Error evaluating formula: "${expression}"`, e);
                }
            },
            addRow(type, initialData = {}) {
                const config = this.config[type];
                if (!config) return;
                this.counters[type]++;
                const id = `${type}_${this.counters[type]}`;
                const container = this.dom.containers[type];
                container.insertAdjacentHTML('beforeend', config.template(id));
                const newRow = container.querySelector(`[data-id="${id}"]`);
                const select = newRow.querySelector('.select-main');
                if (select && config.populateSelect) {
                    config.populateSelect(select);
                }
                if (initialData.selectValue) {
                    select.value = initialData.selectValue;
                }
                if (Object.keys(initialData).length > 0 && !initialData.isInitial) {
                    if(select) select.value = initialData.selectValue || '';
                    newRow.querySelector('.ml-input').value = initialData.mlValue || '0';
                    if(newRow.querySelector('.kcal-output')) newRow.querySelector('.kcal-output').value = initialData.kcalValue || '0';
                    if(newRow.querySelector('.custom-input')) {
                        const customInput = newRow.querySelector('.custom-input');
                        customInput.value = initialData.customValue || '';
                        const showCustom = select.value === this.data[type].customOption || (this.data[type].customOption2 && select.value === this.data[type].customOption2);
                        customInput.style.display = showCustom ? 'block' : 'none';
                    }
                }
                if(initialData.isInitial !== true) this.updateAllCalculations();
            },
            populateSelect(selectElement, type) {
                const configData = this.data[type];
                if (!configData) return;
                selectElement.innerHTML = '';
                this.addOption(selectElement, '', configData.placeholder);
                const addCustomOption = (optName) => {
                    if (!optName) return;
                    this.addOption(selectElement, optName, optName, 0);
                };
                addCustomOption(configData.customOption);
                addCustomOption(configData.customOption2);
                if (configData.options) {
                    configData.options.forEach(opt => {
                        if (typeof opt === 'object') this.addOption(selectElement, opt.name, opt.name, opt.kcal);
                        else this.addOption(selectElement, opt, opt);
                    });
                }
                if (configData.categories) {
                    for (const categoryLabel in configData.categories) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = categoryLabel;
                        configData.categories[categoryLabel].forEach(item => {
                            this.addOption(optgroup, item.name, item.name, item.kcal, item.defaultMl);
                        });
                        selectElement.appendChild(optgroup);
                    }
                }
            },
            addOption(parent, value, text, kcal = null, defaultMl = null) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                if (kcal !== null) option.dataset.kcalPerMl = kcal;
                if (defaultMl !== null) option.dataset.defaultMl = defaultMl;
                parent.appendChild(option);
            },
            updateAllCalculations() {
                this.calculateIdealAndAdjustedWeight();
                this.calculatePerspiratio();
                this.calculateTotals();
                this.calculateDiuresis();
                this.updateSummaryUI();
            },
            setNow(elementId) {
                const timeInput = document.getElementById(elementId);
                if (!timeInput) return;
                const now = new Date();
                timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            },
            changeNumber(elementId, delta) {
                const input = document.getElementById(elementId);
                if (!input) return;
                input.value = (parseFloat(input.value) || 0) + delta;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            },
            calculateDurationInHours(startTimeStr, endTimeStr) {
                try {
                    if (!startTimeStr || !endTimeStr) return 0;
                    const [startH, startM] = startTimeStr.split(':').map(Number);
                    const [endH, endM] = endTimeStr.split(':').map(Number);
                    const startMinutes = startH * 60 + startM;
                    let endMinutes = endH * 60 + endM;
                    if (startMinutes === endMinutes) return 24;
                    if (endMinutes < startMinutes) endMinutes += 24 * 60;
                    return (endMinutes - startMinutes) / 60;
                } catch (error) {
                    return 0;
                }
            },
            calculateIdealAndAdjustedWeight() {
                const height = parseFloat(document.getElementById('height').value);
                const gender = document.getElementById('gender').value;
                const dailyWeight = parseFloat(document.getElementById('dailyWeight').value);
                const idealWeightInput = document.getElementById('idealWeight');
                const notice = document.getElementById('adjustedWeightNotice');
                if (!idealWeightInput || !notice) return; // Guard clause
                if (!height || !gender) {
                    idealWeightInput.value = "Var god ange längd och kön";
                    notice.style.display = 'none';
                    return;
                }
                let idealWeight = (gender === 'Man') ? (50 + 0.91 * (height - 152.4)) : (45.5 + 0.91 * (height - 152.4));
                idealWeight = Math.round(idealWeight * 10) / 10;
                let displayWeight = idealWeight;
                let isAdjusted = false;
                if (dailyWeight > (idealWeight * 1.20)) {
                    displayWeight = idealWeight + 0.4 * (dailyWeight - idealWeight);
                    isAdjusted = true;
                }
                idealWeightInput.value = (Math.round(displayWeight * 10) / 10).toFixed(1);
                notice.style.display = isAdjusted ? 'inline' : 'none';
            },
            _calculatePerspiratioLogic(durationInHours) {
                const isUnder15 = document.getElementById('isUnder15').value === 'yes';
                const weight = parseFloat(document.getElementById('dailyWeight').value) || 0;
                const ventilationStatus = document.getElementById('breathingSupport').value;
                const temperature = parseFloat(document.getElementById('maxTemp').value) || 37.0;

                if (isUnder15 || weight < 50) {
                    this.state.perspiratioWarning = "Perspiratioberäkning ej möjligt vid ålder < 15 och/eller vikt < 50 kg";
                    return 0;
                } else {
                    this.state.perspiratioWarning = "";
                }

                let lBasicPerspiratio = 700;
                switch(ventilationStatus) {
                    case 'niv_humid':
                    case 'hfnc':
                        lBasicPerspiratio = 500;
                        break;
                    case 'intub_humid':
                        lBasicPerspiratio = 400;
                        break;
                }

                let sTempFactor = 1;
                const sTempDifference = temperature - 37;
                if (temperature < 35) {
                    sTempFactor = 0.5;
                } else if (temperature > 41) {
                    sTempFactor = 2;
                } else {
                    sTempFactor = 1 + (sTempDifference * 0.25);
                }

                const perspiratio24h = lBasicPerspiratio * sTempFactor;
                const finalPerspiratio = perspiratio24h * (durationInHours / 24);
                
                return Math.round(finalPerspiratio);
            },
            calculatePerspiratio() {
                const duration = this.calculateDurationInHours(document.getElementById('startTime').value, document.getElementById('endTime').value);
                const finalPerspiratio = this._calculatePerspiratioLogic(duration);
                
                document.getElementById('calculatedPerspiratio').value = `${finalPerspiratio} ml`;
                document.getElementById('perspiratioWarning').textContent = this.state.perspiratioWarning;
            },
            transferPerspiratioToLoss() {
                const perspiratioValue = parseFloat(document.getElementById('calculatedPerspiratio').value) || 0;
                document.getElementById('lossMlInput_perspiratio_static').value = perspiratioValue;
                this.updateAllCalculations();
            },
            calculateTotals() {
                this.state.dailyWeight = parseFloat(document.getElementById('dailyWeight').value) || 0;
                this.state.initialWeight = parseFloat(document.getElementById('initialWeight').value) || 0;

                Object.assign(this.state, {
                    totalIntakeMl: 0, totalIntakeKcal: 0, totalLossMl: 0,
                    medicineCategoryTotals: { Sedering: 0, Antibiotika: 0, Vasoaktiva: 0, Övrigt: 0 },
                    kcalSummary: { peroralt: 0, sondmat: 0, tpn: 0, ivMedicine: 0, intravenousTotal: 0 },
                    totalDiuresisMl: 0, totalPerspiratioMl: 0, totalOtherLossMl: 0
                });
                let kcalFromKristalloider = 0;
                document.querySelectorAll('[data-id]').forEach(row => {
                    const type = row.dataset.type;
                    if (!type) { // Handle static perspiratio row
                        if(row.querySelector('#lossMlInput_perspiratio_static')) {
                            const mlValue = parseFloat(row.querySelector('#lossMlInput_perspiratio_static').value) || 0;
                            this.state.totalLossMl += mlValue;
                            this.state.totalPerspiratioMl += mlValue;
                        }
                        return;
                    }
                    const mlInput = row.querySelector('.ml-input');
                    const mlValue = parseFloat(mlInput?.value) || 0;
                    const select = row.querySelector('.select-main');
                    const selectedOption = select?.options[select.selectedIndex];
                    const kcalOutput = row.querySelector('.kcal-output');
                    let kcalValue = 0;
                    if (kcalOutput && selectedOption) {
                        if (kcalOutput.dataset.manualOverride !== 'true') {
                            const kcalPerMl = parseFloat(selectedOption.dataset.kcalPerMl || '0');
                            kcalValue = Math.round(mlValue * kcalPerMl);
                            kcalOutput.value = kcalValue;
                        } else {
                            kcalValue = parseFloat(kcalOutput.value) || 0;
                        }
                    }
                    if (['fluid', 'medicine', 'bloodProduct', 'tpnSondmat'].includes(type)) {
                        this.state.totalIntakeMl += mlValue;
                        this.state.totalIntakeKcal += kcalValue;
                    } else if (type === 'loss') {
                        this.state.totalLossMl += mlValue;
                        if (select?.value === 'Diures') this.state.totalDiuresisMl += mlValue;
                        else this.state.totalOtherLossMl += mlValue;
                    }
                    if (type === 'fluid') kcalFromKristalloider += kcalValue;
                    if (type === 'medicine') {
                        this.state.kcalSummary.ivMedicine += kcalValue;
                        const category = Object.keys(this.data.medicine.categories).find(cat => this.data.medicine.categories[cat].some(item => item.name === select.value)) || 'Övrigt';
                        this.state.medicineCategoryTotals[category] += mlValue;
                    }
                    if (type === 'tpnSondmat') {
                        if (select.value === 'Peroralt intag') this.state.kcalSummary.peroralt += kcalValue;
                        else if (select.value.startsWith('Sondmat') || select.value === 'Vatten i sond') this.state.kcalSummary.sondmat += kcalValue;
                        else this.state.kcalSummary.tpn += kcalValue;
                    }
                });
                const naclSyringes = parseFloat(document.getElementById('naclSyringes').value) || 0;
                this.state.totalIntakeMl += naclSyringes * 10;
                const pressureSets = parseFloat(document.getElementById('pressureSets').value) || 0;
                const duration = this.calculateDurationInHours(document.getElementById('startTime').value, document.getElementById('endTime').value);
                this.state.totalIntakeMl += pressureSets * 3 * duration;
                this.state.netBalanceMl = this.state.totalIntakeMl - this.state.totalLossMl;
                const cumulativePrev = parseFloat(document.getElementById('cumulativeBalancePrev').value) || 0;
                this.state.cumulativeBalanceMl = cumulativePrev + this.state.netBalanceMl;
                this.state.weightDifferenceKg = this.state.initialWeight ? (this.state.dailyWeight - this.state.initialWeight) : 0;
                this.state.kcalSummary.intravenousTotal = this.state.kcalSummary.ivMedicine + this.state.kcalSummary.tpn + kcalFromKristalloider;

                // Beräkna timdiures
                if (duration > 0 && this.state.dailyWeight > 0) {
                    this.state.avgHourlyDiuresis = this.state.totalDiuresisMl / duration / this.state.dailyWeight;
                } else {
                    this.state.avgHourlyDiuresis = 0;
                }
            },
            updateSummaryUI() {
                for (const key in this.dom.summary) {
                    if (this.dom.summary[key]) {
                        const value = this.state[key];
                        if (key === 'avgHourlyDiuresis') {
                            this.dom.summary[key].textContent = value.toFixed(2);
                            this.dom.summary[key].classList.toggle('low-diuresis', value < 0.5 && this.state.totalDiuresisMl > 0);
                        } else {
                            this.dom.summary[key].textContent = typeof value === 'number' ? (key.includes('Kg') ? value.toFixed(1) : Math.round(value)) : value;
                        }
                    }
                }
            },
            calculateDiuresis() {
                const desiredBalance = parseFloat(document.getElementById('desiredBalanceTomorrow').value) || 0;
                const calcTime = document.getElementById('diuresisCalcTime').value;
                const remainingHours = this.calculateDurationInHours(calcTime, '06:00');
                const plannedSingleIntake = parseFloat(document.getElementById('plannedSingleIntake').value) || 0;
                const plannedHourlyIntake = parseFloat(document.getElementById('plannedHourlyIntake').value) || 0;
                const plannedSingleLosses = parseFloat(document.getElementById('plannedSingleLosses').value) || 0;
                
                document.getElementById('remainingTimeTo0600').value = remainingHours.toFixed(1);
                
                const expectedPerspiratio = this._calculatePerspiratioLogic(remainingHours);
                document.getElementById('expectedPerspiratioRemaining').value = expectedPerspiratio;
                
                const totalFutureIntake = plannedSingleIntake + (plannedHourlyIntake * remainingHours);
                const totalFutureLoss = plannedSingleLosses + expectedPerspiratio;
                
                const requiredDiuresis = this.state.netBalanceMl + totalFutureIntake - totalFutureLoss - desiredBalance;
                const diuresisPerHour = remainingHours > 0 ? requiredDiuresis / remainingHours : 0;

                // Update summary table in modal
                document.getElementById('summaryBalanceTillNow').textContent = Math.round(this.state.netBalanceMl);
                document.getElementById('summaryRemainingHoursFuture').textContent = remainingHours.toFixed(1);
                document.getElementById('summaryPlannedSingleIntakeSummary').textContent = Math.round(plannedSingleIntake);
                document.getElementById('plannedHourlyIntakeDisplay').textContent = Math.round(plannedHourlyIntake);
                document.getElementById('remainingHoursDisplay').textContent = remainingHours.toFixed(1);
                document.getElementById('summaryPlannedHourlyIntakeTotal').textContent = Math.round(plannedHourlyIntake * remainingHours);
                document.getElementById('summaryPlannedSingleLossesSummary').textContent = Math.round(plannedSingleLosses);
                document.getElementById('summaryExpectedPerspiratioRemainingSummary').textContent = Math.round(expectedPerspiratio);
                document.getElementById('summaryDesiredBalanceTomorrowSummary').textContent = Math.round(desiredBalance);
                document.getElementById('summaryTotalCalculatedIntake').textContent = Math.round(this.state.totalIntakeMl + totalFutureIntake);
                document.getElementById('summaryTotalCalculatedLossExclDiuresis').textContent = Math.round(this.state.totalOtherLossMl + this.state.totalPerspiratioMl + totalFutureLoss);
                document.getElementById('diuresisNeedPerHour').textContent = diuresisPerHour.toFixed(1);
            },
            openModal(targetId) {
                if (targetId === 'calculationsModalOverlay') this.populateKcalTableInModal();
                if (targetId === 'printDetailedSummaryModalOverlay') this.populatePrintModal();
                if (targetId === 'diuresisCalculatorModalOverlay') {
                    this.setNow('diuresisCalcTime');
                    this.calculateDiuresis();
                }
                document.getElementById(targetId)?.classList.add('active');
                this.dom.body.classList.add('modal-open');
            },
            closeModal(targetId) {
                document.getElementById(targetId)?.classList.remove('active');
                this.dom.body.classList.remove('modal-open');
            },
             populateKcalTableInModal() {
                const categoryMapping = [
                    { name: 'Kristalloider/Kolloider', key: 'fluid', containerSuffix: 'Kristalloider' },
                    { name: 'Läkemedelsvätskor', key: 'medicine', containerSuffix: 'Medicine' },
                    { name: 'TPN/Sondmat', key: 'tpnSondmat', containerSuffix: 'TpnSondmat' }
                ];

                categoryMapping.forEach(mapping => {
                    const container = document.getElementById(`kcal${mapping.containerSuffix}Container`);
                    if (!container) return;

                    container.innerHTML = `<h3>Kaloriinnehåll ${mapping.name}</h3>`;
                    const table = document.createElement('table');
                    table.innerHTML = '<thead><tr><th>Vätska/Produkt</th><th style="text-align:right;">Kcal/ml</th></tr></thead>';
                    const tbody = document.createElement('tbody');
                    
                    const dataSet = this.data[mapping.key];
                    const items = [];

                    // Add custom options first if they exist
                    if (dataSet.customOption) items.push({ name: dataSet.customOption, kcal: 0 });
                    if (dataSet.customOption2) items.push({ name: dataSet.customOption2, kcal: 0 });
                    // Add options if they exist
                    if (dataSet.options) {
                        dataSet.options.forEach(opt => {
                            if (typeof opt === 'object') {
                                items.push(opt);
                            } else {
                                items.push({ name: opt, kcal: 0 });
                            }
                        });
                    }
                    // Add categorized items
                    if (dataSet.categories) {
                        for (const cat in dataSet.categories) {
                            items.push(...dataSet.categories[cat]);
                        }
                    }
                    
                    // Sort items alphabetically for better readability
                    items.sort((a, b) => (a.name || a).localeCompare(b.name || b));

                    // Remove duplicates
                    const uniqueItems = items.filter((item, index, self) =>
                        index === self.findIndex((t) => (
                            (t.name || t) === (item.name || item)
                        ))
                    );

                    uniqueItems.forEach(item => {
                        const name = item.name || item;
                        const kcal = item.kcal ?? 0;
                        tbody.innerHTML += `<tr><td>${name}</td><td style="text-align:right;">${kcal}</td></tr>`;
                    });

                    table.appendChild(tbody);
                    container.appendChild(table);
                });
            },
            populatePrintModal() {
                this.updateAllCalculations(); // Ensure state is current
                
                // NEW: Populate the info box
                document.getElementById('summaryDatePrint').textContent = document.getElementById('dateInput').value;
                document.getElementById('summaryTimePeriodPrint').textContent = `${document.getElementById('startTime').value} - ${document.getElementById('endTime').value}`;
                const bedSelect = document.getElementById('bedSelect');
                document.getElementById('summaryLocationPrint').textContent = bedSelect.value === 'Annan plats' ? document.getElementById('otherLocationInput').value : bedSelect.value;
                
                document.getElementById('printInitialWeight').textContent = `${this.state.initialWeight.toFixed(1)} kg`;
                document.getElementById('printDailyWeight').textContent = `${this.state.dailyWeight.toFixed(1)} kg`;
                document.getElementById('printIdealWeight').textContent = `${document.getElementById('idealWeight').value} kg ${this.state.adjustedWeight ? '(Justerad)' : ''}`;
                document.getElementById('printWeightDifference').textContent = `${this.state.weightDifferenceKg.toFixed(1)} kg`;
                document.getElementById('printCumulativeBalancePrev').textContent = `${document.getElementById('cumulativeBalancePrev').value} ml`;

                document.getElementById('printTotalIntakeMl').textContent = `${Math.round(this.state.totalIntakeMl)} ml`;
                document.getElementById('printTotalLossMl').textContent = `${Math.round(this.state.totalLossMl)} ml`;
                document.getElementById('printNetBalanceMl').textContent = `${Math.round(this.state.netBalanceMl)} ml`;
                document.getElementById('printCumulativeBalanceMl').textContent = `${Math.round(this.state.cumulativeBalanceMl)} ml`;
                document.getElementById('printTotalKcalIntake').textContent = `${Math.round(this.state.totalIntakeKcal)} Kcal`;

                const intakeContainer = document.getElementById('print-details-intake');
                const lossContainer = document.getElementById('print-details-loss');
                if(!intakeContainer || !lossContainer) return;
                
                let intakeHtml = '';
                let lossHtml = '';

                // --- INTAKE ---
                const intakeSections = [
                    { title: 'Kristalloider/Kolloider', type: 'fluid' },
                    { title: 'Läkemedelsvätskor', type: 'medicine' },
                    { title: 'Blodprodukter', type: 'bloodProduct' },
                    { title: 'TPN/Sondmat/Peroralt', type: 'tpnSondmat' }
                ];
                
                let allIntakeEntries = [];
                intakeSections.forEach(section => {
                    const entries = [];
                    document.querySelectorAll(`#${this.config[section.type].containerId} [data-id]`).forEach(row => {
                        const mlValue = parseFloat(row.querySelector('.ml-input')?.value) || 0;
                        if (mlValue > 0) {
                            const select = row.querySelector('.select-main');
                            let name = select?.value;
                            if (select.value.startsWith('Övrig') || select.value.startsWith('Annan')) {
                                name = row.querySelector('.custom-input')?.value || name;
                            }
                            const kcalValue = parseFloat(row.querySelector('.kcal-output')?.value) || 0;
                            entries.push({ name, ml: mlValue, kcal: kcalValue });
                        }
                    });
                    if (entries.length > 0) {
                        allIntakeEntries.push({category: section.title, items: entries});
                    }
                });

                if (allIntakeEntries.length > 0) {
                    intakeHtml += '<h3>Vätskeintag</h3><table class="summary-table">';
                    allIntakeEntries.forEach(section => {
                        intakeHtml += `<tr class="category-row"><td colspan="2"><strong>${section.category}</strong></td></tr>`;
                        section.items.forEach(item => {
                            const kcalText = item.kcal > 0 ? ` (${item.kcal} Kcal)` : '';
                            intakeHtml += `<tr class="item-row"><td>${item.name}</td><td class="numeric-value">${item.ml} ml${kcalText}</td></tr>`;
                        });
                    });
                    intakeHtml += '</table>';
                }


                // --- LOSSES ---
                const lossEntries = [];
                // Dynamic losses
                document.querySelectorAll(`#lossEntriesContainer [data-id]`).forEach(row => {
                    if (row.dataset.id === 'perspiratio_static') return; // Skip static one for now
                    const mlValue = parseFloat(row.querySelector('.ml-input')?.value) || 0;
                    if (mlValue > 0) {
                        const select = row.querySelector('.select-main');
                        let name = select?.value;
                        if (name === 'Annan förlust') {
                            name = row.querySelector('.custom-input')?.value || name;
                        }
                        lossEntries.push({ name, ml: mlValue });
                    }
                });
                // Static perspiratio
                const perspiratioMl = parseFloat(document.getElementById('lossMlInput_perspiratio_static').value) || 0;
                if (perspiratioMl > 0) {
                    lossEntries.push({ name: 'Perspiratio', ml: perspiratioMl });
                }

                if (lossEntries.length > 0) {
                    lossHtml += `<h3>Förluster</h3><table class="summary-table">`;
                    lossEntries.forEach(entry => {
                        lossHtml += `<tr><td>${entry.name}</td><td class="numeric-value">${entry.ml} ml</td></tr>`;
                    });
                    lossHtml += '</table>';
                }

                intakeContainer.innerHTML = intakeHtml;
                lossContainer.innerHTML = lossHtml;
            },
            collectFormData() {
                const data = { patientInfo: {}, fluidEntries: [], medicineEntries: [], bloodProductEntries: [], tpnSondmatEntries: [], lossEntries: [], perspiratioCalc: {}, diuresisCalc: {} };
                ['dateInput', 'startTime', 'endTime', 'bedSelect', 'otherLocationInput', 'initialWeight', 'dailyWeight', 'height', 'gender', 'isUnder15', 'cumulativeBalancePrev', 'naclSyringes', 'pressureSets'].forEach(id => data.patientInfo[id] = document.getElementById(id).value);
                
                document.querySelectorAll('#fluidEntriesContainer [data-id]').forEach(row => data.fluidEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value, kcalValue: row.querySelector('.kcal-output').value, customValue: row.querySelector('.custom-input').value }));
                document.querySelectorAll('#medicineEntriesContainer [data-id]').forEach(row => data.medicineEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value, kcalValue: row.querySelector('.kcal-output').value, customValue: row.querySelector('.custom-input').value }));
                document.querySelectorAll('#bloodProductEntriesContainer [data-id]').forEach(row => data.bloodProductEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value }));
                document.querySelectorAll('#tpnSondmatEntriesContainer [data-id]').forEach(row => data.tpnSondmatEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value, kcalValue: row.querySelector('.kcal-output').value, customValue: row.querySelector('.custom-input').value }));
                document.querySelectorAll('#lossEntriesContainer [data-id]').forEach(row => {
                    if(row.dataset.id !== 'perspiratio_static') data.lossEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value, customValue: row.querySelector('.custom-input').value })
                });
                data.lossEntries.push({ selectValue: 'Perspiratio', mlValue: document.getElementById('lossMlInput_perspiratio_static').value }); // Add static perspiratio
                
                data.perspiratioCalc = { breathingSupport: document.getElementById('breathingSupport').value, maxTemp: document.getElementById('maxTemp').value };
                data.diuresisCalc = { desiredBalanceTomorrow: document.getElementById('desiredBalanceTomorrow').value, diuresisCalcTime: document.getElementById('diuresisCalcTime').value, plannedSingleIntake: document.getElementById('plannedSingleIntake').value, plannedHourlyIntake: document.getElementById('plannedHourlyIntake').value, plannedSingleLosses: document.getElementById('plannedSingleLosses').value };
                return data;
            },
            saveDataToFile() {
                try {
                    const data = this.collectFormData();
                    const jsonData = JSON.stringify(data, null, 2);
                    const now = new Date();
                    const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
                    const bed = data.patientInfo.bedSelect === 'Annan plats' ? (data.patientInfo.otherLocationInput || 'OkändSäng') : (data.patientInfo.bedSelect || 'OkändSäng');
                    const date = data.patientInfo.dateInput || 'OkäntDatum';
                    const filename = `${bed}_${date}_${time}.json`;
                    
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error("Error saving data:", error);
                }
            },
            loadDataFromFile(event) {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const loadedData = JSON.parse(e.target.result);
                        this.populateFormWithData(loadedData);
                    } catch (err) {
                        console.error("Error parsing JSON file:", err);
                        alert("Kunde inte läsa filen. Kontrollera att det är en giltig JSON-fil.");
                    }
                };
                reader.readAsText(file);
                event.target.value = ''; // Reset file input
            },
            populateFormWithData(data) {
                // Clear existing dynamic rows
                Object.values(this.dom.containers).forEach(container => {
                    container.querySelectorAll('[data-id]:not([data-id="perspiratio_static"])').forEach(row => row.remove());
                });
                Object.keys(this.counters).forEach(key => this.counters[key] = 0);

                // Populate patient info
                for(const id in data.patientInfo) {
                    const el = document.getElementById(id);
                    if(el) el.value = data.patientInfo[id];
                }
                
                // Create and populate rows
                data.fluidEntries?.forEach(d => this.addRow('fluid', d));
                data.medicineEntries?.forEach(d => this.addRow('medicine', d));
                data.bloodProductEntries?.forEach(d => this.addRow('bloodProduct', d));
                data.tpnSondmatEntries?.forEach(d => this.addRow('tpnSondmat', d));
                data.lossEntries?.forEach(d => {
                    if (d.selectValue === 'Perspiratio') {
                        document.getElementById('lossMlInput_perspiratio_static').value = d.mlValue;
                    } else {
                        this.addRow('loss', d);
                    }
                });

                // Populate calculator sections
                if (data.perspiratioCalc) {
                    for(const id in data.perspiratioCalc) {
                        const el = document.getElementById(id);
                        if(el) el.value = data.perspiratioCalc[id];
                    }
                }
                if (data.diuresisCalc) {
                    for(const id in data.diuresisCalc) {
                        const el = document.getElementById(id);
                        if(el) el.value = data.diuresisCalc[id];
                    }
                }

                this.checkInitialInputColors();
                this.updateAllCalculations();
            },
            resetAll() {
                // Rensa alla input-fält
                document.querySelectorAll('input[type="text"], input[type="date"], input[type="time"], select').forEach(el => {
                    if (el.id === 'startTime' || el.id === 'endTime') {
                        el.value = '06:00';
                    } else if (el.id === 'maxTemp') {
                        el.value = '37.0';
                    } else if (el.id === 'isUnder15') {
                        el.value = 'no';
                    } else if (el.tagName === 'SELECT') {
                        el.selectedIndex = 0;
                    } else {
                        el.value = '';
                    }
                });

                // Rensa alla dynamiska rader
                Object.values(this.dom.containers).forEach(container => {
                    container.innerHTML = '';
                });
                
                // Återställ perspiratio-raden
                this.dom.containers.loss.innerHTML = `
                    <div class="loss-entry-row" data-id="perspiratio_static">
                        <div class="grid-item">
                            <select id="lossSelect_perspiratio_static" disabled>
                                <option value="Perspiratio" selected disabled>Perspiratio</option>
                            </select>
                        </div>
                        <div class="grid-item">
                            <input type="text" id="lossMlInput_perspiratio_static" value="0">
                        </div>
                        <button class="remove-fluid-button disabled" disabled><i class="fas fa-trash"></i></button>
                    </div>`;

                // Återställ standardvärden och initiala rader
                this.setDefaultValues();
                this.addInitialRows();
                this.checkInitialInputColors();
                this.updateAllCalculations();
                this.closeModal('confirmationModalOverlay');
            }
        };

        document.addEventListener('DOMContentLoaded', () => app.init());