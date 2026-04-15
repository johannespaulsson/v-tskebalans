/* --- APPLICATION LOGIC --- */
window.app = window.app || {};

Object.assign(window.app, {
    state: {
        totalIntakeMl: 0, totalIntakeKcal: 0, totalIntakeProtein: 0, totalLossMl: 0, netBalanceMl: 0, cumulativeBalanceMl: 0,
        weightDifferenceKg: 0, totalDiuresisMl: 0, totalPerspiratioMl: 0, totalOtherLossMl: 0,
        dailyWeight: 0, height: 0, gender: '', isUnder15: 'no', maxTemp: 37.0, breathingSupport: 'standard',
        mainAppStartTime: '06:00', mainAppEndTime: '06:00',
        patientDate: '', patientTimePeriod: '', patientLocation: '', initialWeight: 0, idealWeight: 0, devineIdealWeight: 0,
        adjustedWeight: false,
        avgHourlyDiuresis: 0,
        perspiratioWarning: '',
        naclSyringeVolume: 0,
        pressureSetVolume: 0,
        medicineCategoryTotals: { Sedering: 0, Antibiotika: 0, Vasoaktiva: 0, Övrigt: 0 },
        kcalSummary: { peroralt: 0, sondmat: 0, tpn: 0, ivMedicine: 0, intravenousTotal: 0 },
        nutrition: { 
            baseWeightSelect: 'ideal', 
            customWeight: 0, 
            proteinFactor: 1.3, 
            kcalFactor: 25,
            calculatedProteinGoal: 0, 
            calculatedKcalGoal: 0 
        }
    },
    counters: { fluid: 0, medicine: 0, bloodProduct: 0, tpnSondmat: 0, loss: 0 },
    forcePrintTimer: null,
    uiState: {
        nutritionExpanded: false
    },

    init() {
        this.cacheDOMElements();
        this.debouncedUpdate = Utils.debounce(this.updateAllCalculations.bind(this), 100);
        this.bindEvents();
        this.setDefaultValues();
        this.addInitialRows();
        this.checkInitialInputColors();
        this.updateAllCalculations();
        this.loadTheme();
    },

    cacheDOMElements() {
        this.dom = {
            body: document.body,
            dateInput: document.getElementById('dateInput'),
            otherLocationInput: document.getElementById('otherLocationInput'),
            loadFromFileInput: document.getElementById('loadFromFileInput'),
            perspiratioWarning: document.getElementById('perspiratioWarning'),
            bmiDisplay: document.getElementById('bmiDisplay'),
            bmiCategory: document.getElementById('bmiCategory'),
            nutritionWeightDisplay: document.getElementById('nutritionWeightDisplay'),
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
                totalIntakeProtein: document.getElementById('totalIntakeProtein'),
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
        document.getElementById('naclSyringes').value = '0';
        document.getElementById('pressureSets').value = '0';
    },

    addInitialRows() {
        this.addRow('loss', { selectValue: 'Diures', isInitial: true });
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
        const targetElement = e.target.closest('[data-action]');
        if (!targetElement) return;
        const { action, target: targetId, delta, type } = targetElement.dataset;
        switch (action) {
            case 'setNow': this.setNow(targetId); break;
            case 'changeNumber': this.changeNumber(targetId, parseInt(delta, 10)); break;
            case 'addRow': this.addRow(type); break;
            case 'removeRow':
                targetElement.closest('[data-id]').remove();
                this.updateAllCalculations();
                break;
            case 'transferPerspiratio': this.transferPerspiratioToLoss(); break;
            case 'forcePrint': this.forcePrint(); break;
            case 'openModal': 
                if (targetId === 'printDetailedSummaryModalOverlay') {
                    const heightVal = document.getElementById('height').value.trim();
                    const genderVal = document.getElementById('gender').value.trim();
                    if (!heightVal || !genderVal) {
                        this.startForcePrintTimer();
                        this.openModal('validationWarningModal');
                        return;
                    }
                }
                if (targetId === 'localStorageManagerModal') this.renderLocalStorageList();
                this.openModal(targetId); 
                break;
            case 'closeModal': 
                this.closeModal(targetId); 
                if (targetId === 'validationWarningModal') {
                    clearInterval(this.forcePrintTimer);
                }
                break;
            case 'save': this.saveDataToFile(); break;
            case 'load': this.dom.loadFromFileInput.click(); break;
            case 'saveLocal': this.saveDataToLocalStorage(targetElement); break;
            case 'loadLocalItem': this.loadDataFromLocalStorage(targetElement.dataset.key); break;
            case 'deleteLocalItem': this.deleteDataFromLocalStorage(targetElement.dataset.key); break;
            case 'print': window.print(); break;
            case 'resetAll': this.resetAll(); break;
            case 'cancelCustomInput': this.cancelCustomInput(targetElement); break;
            case 'toggleTheme': this.toggleTheme(); break;
            case 'toggleNutrition': this.toggleNutrition(); break;
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
        if (target.id === 'diuresisCalcTime') {
            document.getElementById('expectedPerspiratioRemaining').dataset.manualOverride = 'false';
        }
        
        if (target.id === 'nutritionBaseWeightSelect') {
            const val = target.value;
            const customInput = document.getElementById('nutritionCustomWeightInput');
            const pInput = document.getElementById('nutritionProteinFactor');
            const kInput = document.getElementById('nutritionKcalFactor');
            
            customInput.style.display = val === 'custom' ? 'block' : 'none';

            if (val === 'fixed') {
                const currentProteinGoal = this.state.nutrition.calculatedProteinGoal || 100;
                const currentKcalGoal = this.state.nutrition.calculatedKcalGoal || 2000;
                
                if (Utils.getSafeFloat(pInput.value) < 10) pInput.value = currentProteinGoal;
                if (Utils.getSafeFloat(kInput.value) < 100) kInput.value = currentKcalGoal;
                
            } else {
                if (Utils.getSafeFloat(pInput.value) > 10) pInput.value = '1.3';
                if (Utils.getSafeFloat(kInput.value) > 100) kInput.value = '25';
            }
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
                const configData = this.data[row.dataset.type];
                if (configData.customOption || configData.customOption2) {
                    const showCustom = target.value === configData.customOption || (configData.customOption2 && target.value === configData.customOption2);
                    this.toggleCustomInput(target.closest('.custom-input-wrapper') || target.parentElement, showCustom);
                }
                
                const selectedOption = target.options[target.selectedIndex];
                const defaultMl = selectedOption.dataset.defaultMl;
                const mlInput = row.querySelector('.ml-input');
                
                const isProtein = target.value === 'Övrigt protein';
                
                if (isProtein) {
                     mlInput.placeholder = 'gram';
                     const tooltip = row.querySelector('.input-with-tooltip .tooltip');
                     if(tooltip) tooltip.style.display = 'inline-block';
                } else {
                     mlInput.placeholder = '';
                     const tooltip = row.querySelector('.input-with-tooltip .tooltip');
                     if(tooltip) tooltip.style.display = 'none';
                }

                if (defaultMl && mlInput) {
                    mlInput.value = defaultMl;
                }

                if (row.dataset.type === 'bloodProduct') {
                    const tooltipSpan = row.querySelector('.tooltip');
                    if (tooltipSpan) {
                        tooltipSpan.style.display = target.value === 'Trombocyter' ? 'inline-block' : 'none';
                    }
                }
            }
        }
        this.debouncedUpdate();
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
            newRow.querySelector('.ml-input').value = initialData.mlValue || '';
            if(newRow.querySelector('.kcal-output')) newRow.querySelector('.kcal-output').value = initialData.kcalValue || '';
            const customInputWrapper = newRow.querySelector('.custom-input-wrapper');
            if(customInputWrapper) {
                const configData = this.data[type];
                const isCustom = select.value === configData.customOption || (configData.customOption2 && select.value === configData.customOption2);
                if (isCustom) {
                    this.toggleCustomInput(customInputWrapper, true);
                    customInputWrapper.querySelector('.custom-input').value = initialData.customValue || '';
                }
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
                if (typeof opt === 'object') this.addOption(selectElement, opt.name, opt.name, opt.kcal, null, opt.protein, opt.waterFactor);
                else this.addOption(selectElement, opt, opt);
            });
        }
        if (configData.categories) {
            for (const categoryLabel in configData.categories) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = categoryLabel;
                configData.categories[categoryLabel].forEach(item => {
                    this.addOption(optgroup, item.name, item.name, item.kcal, item.defaultMl, item.protein, item.waterFactor);
                });
                selectElement.appendChild(optgroup);
            }
        }
    },

    addOption(parent, value, text, kcal = null, defaultMl = null, protein = null, waterFactor = null) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        if (kcal !== null) option.dataset.kcalPerMl = kcal;
        if (defaultMl !== null) option.dataset.defaultMl = defaultMl;
        if (protein !== null) option.dataset.proteinPerMl = protein;
        if (waterFactor !== null) option.dataset.waterFactor = waterFactor;
        parent.appendChild(option);
    },

    toggleCustomInput(wrapper, showCustom) {
        if (!wrapper) return;
        const select = wrapper.querySelector('.select-main');
        const input = wrapper.querySelector('.custom-input');
        const button = wrapper.querySelector('.cancel-custom-input');
        if (select) select.style.display = showCustom ? 'none' : 'block';
        if (input) input.style.display = showCustom ? 'block' : 'none';
        if (button) button.style.display = showCustom ? 'block' : 'none';
        if (showCustom && input) input.focus();
    },

    cancelCustomInput(button) {
        const wrapper = button.parentElement;
        this.toggleCustomInput(wrapper, false);
        wrapper.querySelector('select').value = '';
        wrapper.querySelector('input').value = '';
        this.updateAllCalculations();
    },

    updateAllCalculations() {
        this.calculateIdealAndAdjustedWeight();
        this.calculatePerspiratio();
        this.calculateTotals();
        this.calculateBMI(); 
        this.calculateNutrition(); 
        this.calculateDiuresis();
        this.validateInputs(); // Ny validering
        this.updateSummaryUI();
    },

    validateInputs() {
        const constraints = this.data.constraints;
        if (!constraints) return;

        const fieldsToValidate = [
            { id: 'initialWeight', constraint: constraints.initialWeight },
            { id: 'dailyWeight', constraint: constraints.dailyWeight },
            { id: 'height', constraint: constraints.height },
            { id: 'maxTemp', constraint: constraints.maxTemp },
            { id: 'naclSyringes', constraint: constraints.naclSyringes },
            { id: 'pressureSets', constraint: constraints.pressureSets }
        ];

        fieldsToValidate.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            this.applyValidation(el, field.constraint);
        });

        document.querySelectorAll('.ml-input').forEach(el => {
            this.applyValidation(el, constraints.mlInput);
        });

        document.querySelectorAll('.kcal-output').forEach(el => {
            if (el.classList.contains('calculated-output') && el.readOnly && el.dataset.manualOverride !== 'true') return;
            this.applyValidation(el, constraints.kcalOutput);
        });
    },

    applyValidation(el, constraint) {
        const val = Utils.getSafeFloat(el.value, null);
        if (el.value.trim() === '') {
            el.classList.remove('warning-input');
            el.title = '';
            return;
        }

        if (val !== null && (val < constraint.min || val > constraint.max)) {
            el.classList.add('warning-input');
            el.title = `Varning: Värdet är utanför rimligt intervall (${constraint.min}-${constraint.max} ${constraint.unit}). Dubbelkolla inmatningen.`;
        } else {
            el.classList.remove('warning-input');
            el.title = '';
        }
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
        input.value = (Utils.getSafeFloat(input.value) || 0) + delta;
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
        const height = Utils.getSafeFloat(document.getElementById('height').value);
        const gender = document.getElementById('gender').value;
        const dailyWeight = Utils.getSafeFloat(document.getElementById('dailyWeight').value);
        const idealWeightInput = document.getElementById('idealWeight');
        const notice = document.getElementById('adjustedWeightNotice');
        
        if (!idealWeightInput || !notice) return;
        
        if (!height || !gender) {
            idealWeightInput.value = "Var god ange längd och kön";
            notice.style.display = 'none';
            this.state.idealWeight = 0;
            this.state.devineIdealWeight = 0;
            this.state.adjustedWeight = false;
            return;
        }
        
        let idealWeight = (gender === 'Man') ? (50 + 0.91 * (height - 152.4)) : (45.5 + 0.91 * (height - 152.4));
        idealWeight = Math.round(idealWeight * 10) / 10;
        let displayWeight = idealWeight;
        this.state.adjustedWeight = false;
        
        if (dailyWeight > (idealWeight * 1.20)) {
            displayWeight = idealWeight + 0.4 * (dailyWeight - idealWeight);
            this.state.adjustedWeight = true;
        }
        
        this.state.devineIdealWeight = idealWeight;
        this.state.idealWeight = Math.round(displayWeight * 10) / 10;
        
        idealWeightInput.value = this.state.idealWeight.toFixed(1);
        notice.style.display = this.state.adjustedWeight ? 'inline' : 'none';
    },

    calculateBMI() {
        const weight = Utils.getSafeFloat(document.getElementById('dailyWeight').value);
        const height = Utils.getSafeFloat(document.getElementById('height').value);
        const bmiDisplay = document.getElementById('bmiDisplay');
        const bmiCategory = document.getElementById('bmiCategory');

        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            const bmiRounded = bmi.toFixed(1);
            bmiDisplay.value = bmiRounded;

            let category = "";
            if (bmi < 18.5) category = "Undervikt";
            else if (bmi < 25) category = "Normalvikt";
            else if (bmi < 30) category = "Övervikt";
            else if (bmi < 35) category = "Obesitas grad 1";
            else if (bmi < 40) category = "Obesitas grad 2";
            else category = "Obesitas grad 3";
            
            bmiCategory.textContent = category;
        } else {
            bmiDisplay.value = "-";
            bmiCategory.textContent = "";
        }
    },

    calculateNutrition() {
        const weightBasis = document.getElementById('nutritionBaseWeightSelect').value;
        const idealOption = document.querySelector('#nutritionBaseWeightSelect option[value="ideal"]');
        const pInput = document.getElementById('nutritionProteinFactor');
        const kInput = document.getElementById('nutritionKcalFactor');
        const pUnit = document.getElementById('nutritionProteinUnit');
        const kUnit = document.getElementById('nutritionKcalUnit');
        
        if (this.state.adjustedWeight) {
            idealOption.textContent = "Idealvikt (Justerad)";
        } else {
            idealOption.textContent = "Idealvikt";
        }

        let weight = 0;
        let isFixedGoal = false;

        if (weightBasis === 'fixed') {
            isFixedGoal = true;
            this.dom.nutritionWeightDisplay.textContent = '';
            pUnit.textContent = 'g totalt';
            kUnit.textContent = 'kcal totalt';
        } else {
            pUnit.textContent = 'g protein/kg';
            kUnit.textContent = 'kcal/kg';

            if (weightBasis === 'actual') {
                weight = Utils.getSafeFloat(document.getElementById('dailyWeight').value);
            } else if (weightBasis === 'ideal') {
                weight = this.state.idealWeight || 0;
            } else if (weightBasis === 'custom') {
                weight = Utils.getSafeFloat(document.getElementById('nutritionCustomWeightInput').value);
            }

            if (weightBasis !== 'custom' && weight > 0) {
                this.dom.nutritionWeightDisplay.textContent = `${weight} kg`;
            } else {
                this.dom.nutritionWeightDisplay.textContent = '';
            }
        }

        const val1 = Utils.getSafeFloat(pInput.value);
        const val2 = Utils.getSafeFloat(kInput.value);

        let proteinGoal = 0;
        let kcalGoal = 0;

        if (isFixedGoal) {
            proteinGoal = Math.round(val1);
            kcalGoal = Math.round(val2);
        } else {
            proteinGoal = Math.round(weight * val1);
            kcalGoal = Math.round(weight * val2);
        }

        this.state.nutrition.calculatedProteinGoal = proteinGoal;
        this.state.nutrition.calculatedKcalGoal = kcalGoal;

        const proteinPercent = proteinGoal > 0 ? Math.round((this.state.totalIntakeProtein / proteinGoal) * 100) : 0;
        const kcalPercent = kcalGoal > 0 ? Math.round((this.state.totalIntakeKcal / kcalGoal) * 100) : 0;

        const proteinTextEl = document.getElementById('nutritionProteinResultText');
        const kcalTextEl = document.getElementById('nutritionKcalResultText');

        proteinTextEl.textContent = `${Math.round(this.state.totalIntakeProtein)} av ${proteinGoal} g (${proteinPercent}%)`;
        kcalTextEl.textContent = `${Math.round(this.state.totalIntakeKcal)} av ${kcalGoal} kcal (${kcalPercent}%)`;

        const updateBar = (barId, percent) => {
            const bar = document.getElementById(barId);
            const cappedPercent = Math.min(percent, 100);
            bar.style.width = `${cappedPercent}%`;
            
            if (percent >= 90) {
                bar.style.backgroundColor = '#28a745';
            } else if (percent >= 50) {
                bar.style.backgroundColor = '#ffc107';
            } else {
                bar.style.backgroundColor = '#dc3545';
            }
        };

        updateBar('nutritionProteinBar', proteinPercent);
        updateBar('nutritionKcalBar', kcalPercent);
    },

    _calculatePerspiratioLogic(durationInHours) {
        const isUnder15 = document.getElementById('isUnder15').value === 'yes';
        const weight = Utils.getSafeFloat(document.getElementById('dailyWeight').value);
        const ventilationStatus = document.getElementById('breathingSupport').value;
        const temperature = Utils.getSafeFloat(document.getElementById('maxTemp').value, 37.0);

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
        const perspiratioValue = Utils.getSafeFloat(document.getElementById('calculatedPerspiratio').value) || 0;
        document.getElementById('lossMlInput_perspiratio_static').value = perspiratioValue;
        this.updateAllCalculations();
    },

    calculateTotals() {
        this.state.dailyWeight = Utils.getSafeFloat(document.getElementById('dailyWeight').value);
        this.state.initialWeight = Utils.getSafeFloat(document.getElementById('initialWeight').value);
        this.state.height = Utils.getSafeFloat(document.getElementById('height').value);

        Object.assign(this.state, {
            totalIntakeMl: 0, totalIntakeKcal: 0, totalIntakeProtein: 0, totalLossMl: 0,
            medicineCategoryTotals: { Sedering: 0, Antibiotika: 0, Vasoaktiva: 0, Övrigt: 0 },
            kcalSummary: { peroralt: 0, sondmat: 0, tpn: 0, ivMedicine: 0, intravenousTotal: 0 },
            totalDiuresisMl: 0, totalPerspiratioMl: 0, totalOtherLossMl: 0
        });
        let kcalFromKristalloider = 0;
        document.querySelectorAll('[data-id]').forEach(row => {
            const type = row.dataset.type;
            if (!type) {
                if(row.querySelector('#lossMlInput_perspiratio_static')) {
                    const mlValue = Utils.getSafeFloat(row.querySelector('#lossMlInput_perspiratio_static').value);
                    this.state.totalLossMl += mlValue;
                    this.state.totalPerspiratioMl += mlValue;
                }
                return;
            }
            const mlInput = row.querySelector('.ml-input');
            const mlValue = Utils.getSafeFloat(mlInput?.value);
            const select = row.querySelector('.select-main');
            const selectedOption = select?.options[select.selectedIndex];
            const kcalOutput = row.querySelector('.kcal-output');
            let kcalValue = 0;
            let proteinValue = 0;
            
            const isProteinSupplement = select && select.value === 'Övrigt protein';

            if (selectedOption) {
                if (isProteinSupplement) {
                    proteinValue = mlValue;
                    this.state.totalIntakeProtein += proteinValue;
                } else {
                    const proteinPerMl = Utils.getSafeFloat(selectedOption.dataset.proteinPerMl || '0');
                    proteinValue = mlValue * proteinPerMl;
                    this.state.totalIntakeProtein += proteinValue;
                }
            }

            if (kcalOutput && selectedOption) {
                if (kcalOutput.dataset.manualOverride !== 'true') {
                    const kcalPerMl = Utils.getSafeFloat(selectedOption.dataset.kcalPerMl || '0');
                    kcalValue = Math.round(mlValue * kcalPerMl);
                    kcalOutput.value = mlValue > 0 ? kcalValue : '';
                } else {
                    kcalValue = Utils.getSafeFloat(kcalOutput.value);
                }
            }
            
            let effectiveMlValue = mlValue;
            if (selectedOption && selectedOption.dataset.waterFactor) {
                effectiveMlValue = mlValue * Utils.getSafeFloat(selectedOption.dataset.waterFactor);
            }

            const effectiveMlText = row.querySelector('.effective-ml-text');
            if (effectiveMlText && selectedOption) {
                const waterFactor = Utils.getSafeFloat(selectedOption.dataset.waterFactor);
                if (!isNaN(waterFactor) && waterFactor < 1 && mlValue > 0 && !isProteinSupplement) {
                    effectiveMlText.textContent = `Vätska: ${Math.round(effectiveMlValue)} ml`;
                    effectiveMlText.style.display = 'block';
                } else {
                    effectiveMlText.style.display = 'none';
                }
            }
            
            if (['fluid', 'medicine', 'bloodProduct', 'tpnSondmat'].includes(type)) {
                if (!isProteinSupplement) {
                    this.state.totalIntakeMl += effectiveMlValue;
                }
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
                const val = select.value;
                const isPeroralt = val === 'Peroralt intag' || (this.data.tpnSondmat.categories['Näringsdryck'] && this.data.tpnSondmat.categories['Näringsdryck'].some(i => i.name === val));
                
                if (isPeroralt) {
                    this.state.kcalSummary.peroralt += kcalValue;
                } else if (val === 'Vatten i sond' || (this.data.tpnSondmat.categories['Sondmat'] && this.data.tpnSondmat.categories['Sondmat'].some(i => i.name === val))) {
                    this.state.kcalSummary.sondmat += kcalValue;
                } else if (isProteinSupplement) {
                     // Do nothing
                } else {
                    this.state.kcalSummary.tpn += kcalValue;
                }
            }
        });
        const naclSyringes = Utils.getSafeFloat(document.getElementById('naclSyringes').value);
        this.state.naclSyringeVolume = naclSyringes * 10;
        this.state.totalIntakeMl += this.state.naclSyringeVolume;

        const pressureSets = Utils.getSafeFloat(document.getElementById('pressureSets').value);
        const duration = this.calculateDurationInHours(document.getElementById('startTime').value, document.getElementById('endTime').value);
        this.state.pressureSetVolume = Math.round(pressureSets * 3 * duration);
        this.state.totalIntakeMl += this.state.pressureSetVolume;

        this.state.netBalanceMl = this.state.totalIntakeMl - this.state.totalLossMl;
        const cumulativePrev = Utils.getSafeFloat(document.getElementById('cumulativeBalancePrev').value);
        this.state.cumulativeBalanceMl = cumulativePrev + this.state.netBalanceMl;
        this.state.weightDifferenceKg = this.state.initialWeight ? (this.state.dailyWeight - this.state.initialWeight) : 0;
        this.state.kcalSummary.intravenousTotal = this.state.kcalSummary.ivMedicine + this.state.kcalSummary.tpn + kcalFromKristalloider;

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
                } else if (key === 'totalIntakeProtein') {
                    this.dom.summary[key].textContent = value.toFixed(1);
                } else {
                    this.dom.summary[key].textContent = typeof value === 'number' ? (key.includes('Kg') ? value.toFixed(1) : Math.round(value)) : value;
                }
            }
        }
    },

    calculateDiuresis() {
        const desiredBalance = Utils.getSafeFloat(document.getElementById('desiredBalanceTomorrow').value);
        const calcTime = document.getElementById('diuresisCalcTime').value;
        const remainingHours = this.calculateDurationInHours(calcTime, '06:00');
        const plannedSingleIntake = Utils.getSafeFloat(document.getElementById('plannedSingleIntake').value);
        const plannedHourlyIntake = Utils.getSafeFloat(document.getElementById('plannedHourlyIntake').value);
        const plannedSingleLosses = Utils.getSafeFloat(document.getElementById('plannedSingleLosses').value);
        
        const expectedPerspiratioInput = document.getElementById('expectedPerspiratioRemaining');
        const calculatedPerspiratio = this._calculatePerspiratioLogic(remainingHours);

        expectedPerspiratioInput.value = calculatedPerspiratio;
        const expectedPerspiratio = Utils.getSafeFloat(expectedPerspiratioInput.value);

        document.getElementById('remainingTimeTo0600').value = remainingHours.toFixed(1);
        
        const totalFutureIntake = plannedSingleIntake + (plannedHourlyIntake * remainingHours);
        const totalFutureLoss = plannedSingleLosses + expectedPerspiratio;
        
        const requiredDiuresis = this.state.netBalanceMl + totalFutureIntake - totalFutureLoss - desiredBalance;
        const diuresisPerHour = remainingHours > 0 ? requiredDiuresis / remainingHours : 0;

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
            document.getElementById('expectedPerspiratioRemaining').dataset.manualOverride = 'false';
            this.setNow('diuresisCalcTime');
            this.calculateDiuresis();
        }
        if (targetId === 'localStorageManagerModal') {
            this.renderLocalStorageList();
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
            table.innerHTML = '<thead><tr><th>Vätska/Produkt</th><th style="text-align:right;">Kcal/ml</th><th style="text-align:right;">Protein (g/ml)</th></tr></thead>';
            const tbody = document.createElement('tbody');
            
            const dataSet = this.data[mapping.key];
            const items = [];

            if (dataSet.customOption) items.push({ name: dataSet.customOption, kcal: 0, protein: 0 });
            if (dataSet.customOption2) items.push({ name: dataSet.customOption2, kcal: 0, protein: 0 });
            if (dataSet.options) {
                dataSet.options.forEach(opt => {
                    if (typeof opt === 'object') items.push(opt);
                    else items.push({ name: opt, kcal: 0, protein: 0 });
                });
            }
            if (dataSet.categories) {
                for (const cat in dataSet.categories) {
                    items.push(...dataSet.categories[cat]);
                }
            }
            
            items.sort((a, b) => (a.name || a).localeCompare(b.name || b));

            const uniqueItems = items.filter((item, index, self) =>
                index === self.findIndex((t) => (
                    (t.name || t) === (item.name || item)
                ))
            );

            uniqueItems.forEach(item => {
                const name = item.name || item;
                const kcal = item.kcal ?? 0;
                const protein = item.protein !== undefined ? item.protein : '-';
                const waterFactorHtml = item.waterFactor ? ` <br><span style="font-size: 0.8em; color: var(--text-label); font-weight: normal;">(Vätska ${(item.waterFactor * 100).toFixed(0)}%)</span>` : '';
                
                let tooltipHtml = '';
                if (name.includes('Propofol')) {
                    tooltipHtml = `
                        <span class="tooltip">
                            <i class="fas fa-info-circle" tabindex="0" role="button" aria-label="Hjälpinformation"></i>
                            <span class="tooltiptext">Källa: ePed</span>
                        </span>`;
                }
                tbody.innerHTML += `<tr><td>${name}${waterFactorHtml} ${tooltipHtml}</td><td style="text-align:right;">${kcal}</td><td style="text-align:right;">${protein}</td></tr>`;
            });

            table.appendChild(tbody);
            container.appendChild(table);
        });
    },

    populatePrintModal() {
        this.updateAllCalculations();
        
        document.getElementById('summaryDatePrint').textContent = document.getElementById('dateInput').value;
        document.getElementById('summaryTimePeriodPrint').textContent = `${document.getElementById('startTime').value} - ${document.getElementById('endTime').value}`;
        const bedSelect = document.getElementById('bedSelect');
        document.getElementById('summaryLocationPrint').textContent = bedSelect.value === 'Annan plats' ? document.getElementById('otherLocationInput').value : bedSelect.value;
        
        document.getElementById('printInitialWeight').textContent = `${this.state.initialWeight.toFixed(1)} kg`;
        document.getElementById('printDailyWeight').textContent = `${this.state.dailyWeight.toFixed(1)} kg`;
        document.getElementById('printHeight').textContent = `${this.state.height.toFixed(0)} cm`;
        
        const idealWeightRow = document.getElementById('printIdealWeightRow');
        const adjustedWeightRow = document.getElementById('printAdjustedWeightRow');

        if (this.state.devineIdealWeight > 0) {
            idealWeightRow.style.display = '';
            document.getElementById('printIdealWeight').textContent = `${this.state.devineIdealWeight.toFixed(1)} kg`;
            
            if (this.state.adjustedWeight) {
                adjustedWeightRow.style.display = '';
                document.getElementById('printAdjustedWeight').textContent = `${this.state.idealWeight.toFixed(1)} kg`;
            } else {
                adjustedWeightRow.style.display = 'none';
            }
        } else {
            idealWeightRow.style.display = 'none';
            adjustedWeightRow.style.display = 'none';
        }

        const bmiValue = document.getElementById('bmiDisplay').value;
        const bmiRow = document.getElementById('printBMIRow');
        if (bmiValue && bmiValue !== '-' && !isNaN(parseFloat(bmiValue))) {
            bmiRow.style.display = '';
            document.getElementById('printBMI').textContent = bmiValue;
        } else {
            bmiRow.style.display = 'none';
        }
        
        document.getElementById('printWeightDifference').textContent = `${this.state.weightDifferenceKg.toFixed(1)} kg`;
        document.getElementById('printCumulativeBalancePrev').textContent = `${document.getElementById('cumulativeBalancePrev').value} ml`;

        document.getElementById('printTotalIntakeMl').textContent = `${Math.round(this.state.totalIntakeMl)} ml`;
        document.getElementById('printTotalLossMl').textContent = `${Math.round(this.state.totalLossMl)} ml`;
        document.getElementById('printNetBalanceMl').textContent = `${Math.round(this.state.netBalanceMl)} ml`;
        document.getElementById('printCumulativeBalanceMl').textContent = `${Math.round(this.state.cumulativeBalanceMl)} ml`;
        document.getElementById('printTotalKcalIntake').textContent = `${Math.round(this.state.totalIntakeKcal)} Kcal`;
        document.getElementById('printTotalIntakeProtein').textContent = `${this.state.totalIntakeProtein.toFixed(1)} g`;

        const printNutritionContainer = document.getElementById('printNutritionContainer');
        printNutritionContainer.style.display = 'block';
        
        const weightBasis = document.getElementById('nutritionBaseWeightSelect').value;
        let weight = 0;
        let weightLabel = '';
        let isFixed = false;

        if (weightBasis === 'actual') {
            weight = Utils.getSafeFloat(document.getElementById('dailyWeight').value);
            weightLabel = 'Aktuell vikt';
        } else if (weightBasis === 'ideal') {
            weight = this.state.idealWeight || 0;
            weightLabel = this.state.adjustedWeight ? 'Idealvikt (Justerad)' : 'Idealvikt';
        } else if (weightBasis === 'custom') {
            weight = Utils.getSafeFloat(document.getElementById('nutritionCustomWeightInput').value);
            weightLabel = 'Annan vikt';
        } else if (weightBasis === 'fixed') {
            isFixed = true;
            weightLabel = 'Eget totalmål';
        }

        const val1 = Utils.getSafeFloat(document.getElementById('nutritionProteinFactor').value);
        const val2 = Utils.getSafeFloat(document.getElementById('nutritionKcalFactor').value);

        let proteinGoal = 0;
        let kcalGoal = 0;

        if (isFixed) {
            proteinGoal = Math.round(val1);
            kcalGoal = Math.round(val2);
            document.getElementById('printNutritionBase').textContent = weightLabel;
            document.getElementById('printNutritionProteinLabelCell').textContent = 'Protein (Eget mål):';
            document.getElementById('printNutritionKcalLabelCell').textContent = 'Energi (Eget mål):';
        } else {
            proteinGoal = Math.round(weight * val1);
            kcalGoal = Math.round(weight * val2);
            document.getElementById('printNutritionBase').textContent = `${weightLabel} (${weight} kg)`;
            document.getElementById('printNutritionProteinLabelCell').innerHTML = `Protein (<span id="printNutritionProteinFactor">${val1}</span> g/kg):`;
            document.getElementById('printNutritionKcalLabelCell').innerHTML = `Energi (<span id="printNutritionKcalFactor">${val2}</span> kcal/kg):`;
        }

        const proteinPercent = proteinGoal > 0 ? Math.round((this.state.totalIntakeProtein / proteinGoal) * 100) : 0;
        const kcalPercent = kcalGoal > 0 ? Math.round((this.state.totalIntakeKcal / kcalGoal) * 100) : 0;

        document.getElementById('printNutritionProteinResult').textContent = `${this.state.totalIntakeProtein.toFixed(1)} av ${proteinGoal} g (${proteinPercent}%)`;
        document.getElementById('printNutritionKcalResult').textContent = `${Math.round(this.state.totalIntakeKcal)} av ${kcalGoal} kcal (${kcalPercent}%)`;

        const intakeContainer = document.getElementById('print-details-intake');
        const lossContainer = document.getElementById('print-details-loss');

        if(!intakeContainer || !lossContainer) return;
        
        let intakeHtml = '';
        let lossAndGoalHtml = '';

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
                const mlValue = Utils.getSafeFloat(row.querySelector('.ml-input')?.value);
                if (mlValue > 0) {
                    const select = row.querySelector('.select-main');
                    let name = select?.value;
                    if (select.value.startsWith('Övrig') || select.value.startsWith('Annan')) {
                        name = row.querySelector('.custom-input')?.value || name;
                    }
                    name = Utils.escapeHtml(name);
                    const kcalValue = Utils.getSafeFloat(row.querySelector('.kcal-output')?.value);
                    
                    const isProteinSupplement = select.value === 'Övrigt protein';
                    
                    const waterFactor = select.options[select.selectedIndex]?.dataset.waterFactor;
                    let effectiveMlText = '';
                    if (waterFactor && !isProteinSupplement) {
                        const effectiveMl = mlValue * Utils.getSafeFloat(waterFactor);
                        effectiveMlText = ` (varav vätska ${Math.round(effectiveMl)} ml)`;
                    }
                    
                    entries.push({ name, ml: mlValue, kcal: kcalValue, isProteinSupplement: isProteinSupplement, effectiveMlText: effectiveMlText });
                }
            });

            if (section.type === 'fluid') {
                if (this.state.naclSyringeVolume > 0) {
                    entries.push({ name: 'NaCl från förfyllda sprutor', ml: this.state.naclSyringeVolume, kcal: 0 });
                }
                if (this.state.pressureSetVolume > 0) {
                    entries.push({ name: 'NaCl från tryckset', ml: this.state.pressureSetVolume, kcal: 0 });
                }
            }

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
                    const unit = item.isProteinSupplement ? 'g' : 'ml';
                    intakeHtml += `<tr class="item-row"><td>${item.name}</td><td class="numeric-value">${Math.round(item.ml)} ${unit}${item.effectiveMlText || ''}${kcalText}</td></tr>`;
                });
            });
            intakeHtml += '</table>';
        }

        const lossEntries = [];
        document.querySelectorAll(`#lossEntriesContainer [data-id]`).forEach(row => {
            if (row.dataset.id === 'perspiratio_static') return;
            const mlValue = Utils.getSafeFloat(row.querySelector('.ml-input')?.value);
            if (mlValue > 0) {
                const select = row.querySelector('.select-main');
                let name = select?.value;
                if (name === 'Annan förlust') {
                    name = row.querySelector('.custom-input')?.value || name;
                }
                name = Utils.escapeHtml(name);
                lossEntries.push({ name, ml: mlValue });
            }
        });
        const perspiratioMl = Utils.getSafeFloat(document.getElementById('lossMlInput_perspiratio_static').value);
        if (perspiratioMl > 0) {
            lossEntries.push({ name: 'Perspiratio', ml: perspiratioMl });
        }

        if (lossEntries.length > 0) {
            lossAndGoalHtml += `<h3>Förluster</h3><table class="summary-table">`;
            lossEntries.forEach(entry => {
                let text = `<tr><td>${entry.name}</td><td class="numeric-value">${Math.round(entry.ml)} ml</td></tr>`;
                if (entry.name === 'Diures') {
                    text = `<tr><td>${entry.name}</td><td class="numeric-value">${Math.round(entry.ml)} ml (${this.state.avgHourlyDiuresis.toFixed(2)} ml/kg/h)</td></tr>`;
                }
                lossAndGoalHtml += text;
            });
            lossAndGoalHtml += '</table>';
        }

        if (document.getElementById('includeDiuresisGoalInPrint').checked) {
            const currentBalance = this.state.netBalanceMl;
            const futureIntake = (Utils.getSafeFloat(document.getElementById('plannedSingleIntake').value)) + 
                                 ((Utils.getSafeFloat(document.getElementById('plannedHourlyIntake').value)) * this.calculateDurationInHours(document.getElementById('diuresisCalcTime').value, '06:00'));
            const futureLoss = (Utils.getSafeFloat(document.getElementById('plannedSingleLosses').value)) + 
                               (Utils.getSafeFloat(document.getElementById('expectedPerspiratioRemaining').value));
            const desiredBalance = Utils.getSafeFloat(document.getElementById('desiredBalanceTomorrow').value);
            const diuresisNeedPerHour = document.getElementById('diuresisNeedPerHour').textContent;
            const remainingHours = this.calculateDurationInHours(document.getElementById('diuresisCalcTime').value, '06:00').toFixed(1);
            const diuresisNeedTotal = Utils.getSafeFloat(diuresisNeedPerHour) * Utils.getSafeFloat(remainingHours);

            lossAndGoalHtml += `
                <h3>Plan för att nå vätskebalansmål (från kl. ${document.getElementById('diuresisCalcTime').value})</h3>
                <table class="summary-table">
                    <tr><td>Nuvarande nettobalans:</td><td class="numeric-value">${Math.round(currentBalance)} ml</td></tr>
                    <tr><td>+ Förväntad framtida tillförsel:</td><td class="numeric-value">${Math.round(futureIntake)} ml</td></tr>
                    <tr><td>- Förväntade framtida förluster (exkl. diures):</td><td class="numeric-value">${Math.round(futureLoss)} ml</td></tr>
                    <tr><td>- Önskad nettobalans kl 06:00:</td><td class="numeric-value">${Math.round(desiredBalance)} ml</td></tr>
                    <tr class="highlight-row-print"><td><strong>= Totalt diuresbehov (återstående tid):</strong></td><td class="numeric-value"><strong>${Math.round(diuresisNeedTotal)} ml</strong></td></tr>
                    <tr><td><em>Motsvarar:</em></td><td class="numeric-value"><em>${diuresisNeedPerHour} ml/h i ${remainingHours} timmar</em></td></tr>
                </table>`;
        }

        intakeContainer.innerHTML = intakeHtml;
        lossContainer.innerHTML = lossAndGoalHtml;
    },

    collectFormData() {
        const data = { patientInfo: {}, fluidEntries: [], medicineEntries: [], bloodProductEntries: [], tpnSondmatEntries: [], lossEntries: [], perspiratioCalc: {}, diuresisCalc: {}, nutritionCalc: {} };
        ['dateInput', 'startTime', 'endTime', 'bedSelect', 'otherLocationInput', 'initialWeight', 'dailyWeight', 'height', 'gender', 'isUnder15', 'cumulativeBalancePrev', 'naclSyringes', 'pressureSets'].forEach(id => data.patientInfo[id] = document.getElementById(id).value);
        
        document.querySelectorAll('#fluidEntriesContainer [data-id]').forEach(row => data.fluidEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value, kcalValue: row.querySelector('.kcal-output').value, customValue: row.querySelector('.custom-input').value }));
        document.querySelectorAll('#medicineEntriesContainer [data-id]').forEach(row => data.medicineEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value, kcalValue: row.querySelector('.kcal-output').value, customValue: row.querySelector('.custom-input').value }));
        document.querySelectorAll('#bloodProductEntriesContainer [data-id]').forEach(row => data.bloodProductEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value }));
        document.querySelectorAll('#tpnSondmatEntriesContainer [data-id]').forEach(row => data.tpnSondmatEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value, kcalValue: row.querySelector('.kcal-output').value, customValue: row.querySelector('.custom-input').value }));
        document.querySelectorAll('#lossEntriesContainer [data-id]').forEach(row => {
            if(row.dataset.id !== 'perspiratio_static') data.lossEntries.push({ selectValue: row.querySelector('.select-main').value, mlValue: row.querySelector('.ml-input').value, customValue: row.querySelector('.custom-input').value })
        });
        data.lossEntries.push({ selectValue: 'Perspiratio', mlValue: document.getElementById('lossMlInput_perspiratio_static').value });
        
        data.perspiratioCalc = { breathingSupport: document.getElementById('breathingSupport').value, maxTemp: document.getElementById('maxTemp').value };
        data.diuresisCalc = { desiredBalanceTomorrow: document.getElementById('desiredBalanceTomorrow').value, diuresisCalcTime: document.getElementById('diuresisCalcTime').value, plannedSingleIntake: document.getElementById('plannedSingleIntake').value, plannedHourlyIntake: document.getElementById('plannedHourlyIntake').value, plannedSingleLosses: document.getElementById('plannedSingleLosses').value };
        
        data.nutritionCalc = {
            baseWeightSelect: document.getElementById('nutritionBaseWeightSelect').value,
            customWeightInput: document.getElementById('nutritionCustomWeightInput').value,
            proteinFactor: document.getElementById('nutritionProteinFactor').value,
            kcalFactor: document.getElementById('nutritionKcalFactor').value
        };

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

    getLocalStorageData() {
        try {
            const raw = localStorage.getItem('iva_skovde_vatskebalans_saves');
            return raw ? JSON.parse(raw) : {};
        } catch (error) {
            console.error("Error reading localStorage:", error);
            return {};
        }
    },

    saveDataToLocalStorage(buttonElement) {
        try {
            const data = this.collectFormData();
            const now = new Date();
            const timeString = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            const dateString = now.toLocaleDateString('sv-SE');
            
            const bed = data.patientInfo.bedSelect === 'Annan plats' ? (data.patientInfo.otherLocationInput || 'Okänd plats') : (data.patientInfo.bedSelect || 'Okänd plats');
            const defaultName = `${bed} - ${dateString} ${timeString}`;

            let saveName;
            try {
                  saveName = prompt("Ange ett namn för att spara (eller tryck OK för standardnamn):", defaultName);
                  if (saveName === null) return;
            } catch(e) {
                  saveName = defaultName;
            }

            const finalName = (!saveName || saveName.trim() === "") ? defaultName : saveName;
            const saves = this.getLocalStorageData();
            const saveId = Date.now().toString();
            
            saves[saveId] = { id: saveId, name: finalName, timestamp: now.toISOString(), data: data };
            localStorage.setItem('iva_skovde_vatskebalans_saves', JSON.stringify(saves));
            
            if (buttonElement) {
                const originalText = buttonElement.textContent;
                buttonElement.textContent = "Sparat!";
                buttonElement.style.backgroundColor = "#28a745";
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.style.backgroundColor = "";
                }, 1500);
            }
        } catch (error) {
            console.error("Error saving to local storage:", error);
            alert("Kunde inte spara. Minnet kan vara fullt eller privat läge aktivt.");
        }
    },

    renderLocalStorageList() {
        const container = document.getElementById('localStorageListContainer');
        const saves = this.getLocalStorageData();
        const keys = Object.keys(saves).sort((a, b) => b - a);

        if (keys.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-label); font-style: italic; padding: 20px;">Inga sparade filer hittades.</p>';
            return;
        }

        let html = '';
        keys.forEach(key => {
            const save = saves[key];
            const date = new Date(save.timestamp);
            const dateStr = date.toLocaleString('sv-SE');
            
            html += `
                <div class="saved-file-item">
                    <div class="saved-file-info">
                        ${save.name}
                        <span class="saved-file-meta">Sparad: ${dateStr}</span>
                    </div>
                    <div class="saved-file-actions">
                        <button class="btn-load" data-action="loadLocalItem" data-key="${key}">Ladda</button>
                        <button class="btn-delete" data-action="deleteLocalItem" data-key="${key}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    loadDataFromLocalStorage(key) {
        try {
            const saves = this.getLocalStorageData();
            const save = saves[key];
            if (!save) {
                alert("Kunde inte hitta filen.");
                return;
            }
            
            if (confirm(`Vill du ladda "${save.name}"? Detta skriver över nuvarande inmatning.`)) {
                this.populateFormWithData(save.data);
                this.closeModal('localStorageManagerModal');
            }
        } catch (error) {
            console.error("Error loading from local storage:", error);
            alert("Kunde inte hämta data.");
        }
    },

    deleteDataFromLocalStorage(key) {
        if (!confirm("Är du säker på att du vill ta bort denna fil?")) return;
        
        try {
            const saves = this.getLocalStorageData();
            delete saves[key];
            localStorage.setItem('iva_skovde_vatskebalans_saves', JSON.stringify(saves));
            this.renderLocalStorageList();
        } catch (error) {
            console.error("Error deleting from local storage:", error);
            alert("Ett fel uppstod vid radering.");
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
        event.target.value = '';
    },

    populateFormWithData(data) {
        Object.values(this.dom.containers).forEach(container => {
            container.querySelectorAll('[data-id]:not([data-id="perspiratio_static"])').forEach(row => row.remove());
        });
        Object.keys(this.counters).forEach(key => this.counters[key] = 0);

        for(const id in data.patientInfo) {
            const el = document.getElementById(id);
            if(el) el.value = data.patientInfo[id];
        }
        
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
        if (data.nutritionCalc) {
            document.getElementById('nutritionBaseWeightSelect').value = data.nutritionCalc.baseWeightSelect || 'ideal';
            document.getElementById('nutritionCustomWeightInput').value = data.nutritionCalc.customWeightInput || '';
            document.getElementById('nutritionProteinFactor').value = data.nutritionCalc.proteinFactor || 1.3;
            document.getElementById('nutritionKcalFactor').value = data.nutritionCalc.kcalFactor || 25;
            
            const customInput = document.getElementById('nutritionCustomWeightInput');
            customInput.style.display = data.nutritionCalc.baseWeightSelect === 'custom' ? 'block' : 'none';
        }

        this.checkInitialInputColors();
        this.updateAllCalculations();
    },

    resetAll() {
        document.querySelectorAll('input[type="text"], input[type="date"], input[type="time"], select').forEach(el => {
            if (el.id === 'startTime' || el.id === 'endTime') {
                el.value = '06:00';
            } else if (el.id === 'maxTemp') {
                el.value = '37.0';
            } else if (el.id === 'isUnder15') {
                el.value = 'no';
            } else if (el.id === 'nutritionProteinFactor') {
                el.value = '1.3';
            } else if (el.id === 'nutritionKcalFactor') {
                el.value = '25';
            } else if (el.id === 'nutritionBaseWeightSelect') {
                el.value = 'ideal';
            } else if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
            } else {
                el.value = '';
            }
        });
        
        document.getElementById('nutritionCustomWeightInput').style.display = 'none';
        this.uiState.nutritionExpanded = false;
        this.updateNutritionToggleUI();

        Object.values(this.dom.containers).forEach(container => {
            container.innerHTML = '';
        });
        
        this.dom.containers.loss.innerHTML = `
            <div class="loss-entry-row" data-id="perspiratio_static">
                <div class="grid-item">
                    <select id="lossSelect_perspiratio_static" disabled>
                        <option value="Perspiratio" selected disabled>Perspiratio</option>
                    </select>
                </div>
                <div class="grid-item">
                    <input type="text" id="lossMlInput_perspiratio_static" value="">
                </div>
                <button class="remove-fluid-button disabled" disabled><i class="fas fa-trash"></i></button>
            </div>`;

        this.setDefaultValues();
        this.addInitialRows();
        this.checkInitialInputColors();
        this.updateAllCalculations();
        this.closeModal('confirmationModalOverlay');
    },
    
    startForcePrintTimer() {
        const btn = document.getElementById('forcePrintButton');
        if (!btn) return;
        
        btn.disabled = true;
        let timeLeft = 30;
        btn.textContent = `Forcera (${timeLeft})`;
        
        clearInterval(this.forcePrintTimer);
        
        this.forcePrintTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                btn.textContent = `Forcera (${timeLeft})`;
            } else {
                clearInterval(this.forcePrintTimer);
                btn.disabled = false;
                btn.textContent = "Forcera utskrift";
                btn.style.backgroundColor = "#dc3545";
            }
        }, 1000);
    },

    forcePrint() {
        clearInterval(this.forcePrintTimer);
        this.closeModal('validationWarningModal');
        this.openModal('printDetailedSummaryModalOverlay');
    },

    toggleTheme() {
        this.dom.body.classList.toggle('dark-mode');
        const isDark = this.dom.body.classList.contains('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        this.saveThemePreference(isDark ? 'dark' : 'light');
    },

    toggleNutrition() {
        this.uiState.nutritionExpanded = !this.uiState.nutritionExpanded;
        this.updateNutritionToggleUI();
    },

    updateNutritionToggleUI() {
        const content = document.getElementById('nutritionGoalsContent');
        const header = document.querySelector('.nutrition-goals-header');
        
        if (this.uiState.nutritionExpanded) {
            content.style.display = 'block';
            header.classList.add('expanded');
        } else {
            content.style.display = 'none';
            header.classList.remove('expanded');
        }
    },

    saveThemePreference(theme) {
        try {
            localStorage.setItem('iva_skovde_theme', theme);
        } catch(e) {
            console.error("Kunde inte spara temainställning.");
        }
    },

    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('iva_skovde_theme');
            if (savedTheme === 'dark') {
                this.dom.body.classList.add('dark-mode');
                const icon = document.querySelector('#themeToggle i');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        } catch(e) {
            console.error("Kunde inte läsa temainställning.");
        }
    }
});
