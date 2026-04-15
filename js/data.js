/* --- DATA & CONFIGURATION --- */
window.app = window.app || {};

app.config = {
    fluid: {
        containerId: 'fluidEntriesContainer',
        template: (id) => `<div class="fluid-entry-row" data-id="${id}" data-type="fluid"><div class="grid-item"><div class="custom-input-wrapper"><select class="select-main"></select><input type="text" class="custom-input" placeholder="Ange övrig vätska" style="display: none;"><button class="cancel-custom-input" data-action="cancelCustomInput" style="display: none;">&times;</button></div></div><div class="grid-item"><input type="text" class="ml-input" value="" placeholder=""></div><div class="grid-item"><input type="text" class="kcal-output" value="" placeholder=""></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
        populateSelect: (select) => app.populateSelect(select, 'fluid')
    },
    medicine: {
        containerId: 'medicineEntriesContainer',
        template: (id) => `<div class="fluid-entry-row" data-id="${id}" data-type="medicine"><div class="grid-item"><div class="custom-input-wrapper"><select class="select-main"></select><input type="text" class="custom-input" placeholder="Övrigt lkm" style="display: none;"><button class="cancel-custom-input" data-action="cancelCustomInput" style="display: none;">&times;</button></div></div><div class="grid-item"><input type="text" class="ml-input" value="" placeholder=""></div><div class="grid-item"><input type="text" class="kcal-output" value="" placeholder=""></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
        populateSelect: (select) => app.populateSelect(select, 'medicine')
    },
    bloodProduct: {
        containerId: 'bloodProductEntriesContainer',
        template: (id) => `<div class="blood-product-entry-row" data-id="${id}" data-type="bloodProduct"><div class="grid-item"><select class="select-main"></select></div><div class="grid-item"><div class="input-with-tooltip"><input type="text" class="ml-input" value="" placeholder=""><span class="tooltip" style="display: none;"><i class="fas fa-info-circle" tabindex="0" role="button" aria-label="Hjälpinformation"></i><span class="tooltiptext">Volymen för en enhet trombocyter är oftast cirka 200 ml, men kan variera. Kontrollera påsen.</span></span></div></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
        populateSelect: (select) => app.populateSelect(select, 'bloodProduct')
    },
    tpnSondmat: {
        containerId: 'tpnSondmatEntriesContainer',
        template: (id) => `<div class="tpn-sondmat-entry-row" data-id="${id}" data-type="tpnSondmat">
            <div class="grid-item">
                <div class="custom-input-wrapper">
                    <select class="select-main"></select>
                    <input type="text" class="custom-input" placeholder="Övrigt" style="display: none;">
                    <button class="cancel-custom-input" data-action="cancelCustomInput" style="display: none;">&times;</button>
                </div>
            </div>
            <div class="grid-item">
                <div class="input-with-tooltip" style="width: 100%;">
                    <input type="text" class="ml-input" value="" placeholder="">
                    <span class="tooltip" style="display: none; margin-left: 5px;">
                        <i class="fas fa-info-circle" style="color: #d93025;"></i>
                        <span class="tooltiptext">Ange mängd protein i gram (t.ex. från pulver). Detta värde adderas till totalt proteinintag men räknas som 0 ml i vätskebalansen.</span>
                    </span>
                </div>
                <span class="effective-ml-text" style="font-size: 0.75rem; color: var(--primary-color); display: none; margin-top: 2px;"></span>
            </div>
            <div class="grid-item"><input type="text" class="kcal-output" value="" placeholder=""></div>
            <button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button>
        </div>`,
        populateSelect: (select) => app.populateSelect(select, 'tpnSondmat')
    },
    loss: {
        containerId: 'lossEntriesContainer',
        template: (id) => `<div class="loss-entry-row" data-id="${id}" data-type="loss"><div class="grid-item"><div class="custom-input-wrapper"><select class="select-main"></select><input type="text" class="custom-input" placeholder="Ange annan förlust" style="display: none;"><button class="cancel-custom-input" data-action="cancelCustomInput" style="display: none;">&times;</button></div></div><div class="grid-item"><input type="text" class="ml-input" value="" placeholder=""></div><button class="remove-fluid-button" data-action="removeRow"><i class="fas fa-trash"></i></button></div>`,
        populateSelect: (select) => app.populateSelect(select, 'loss')
    }
};

app.data = {
    fluid: {
        placeholder: 'Välj vätska', customOption: 'Övrig vätska',
        categories: {
            "Glucos utan elektrolyter": [{ name: "Glukos 25 mg/ml", kcal: 0.1 }, { name: "Glukos 50 mg/ml", kcal: 0.2 }, { name: "Glukos 100 mg/ml", kcal: 0.4 }, { name: "Glukos 200 mg/ml", kcal: 0.8 }, { name: "Glukos 300 mg/ml", kcal: 1.2 }],
            "Kolloider": [{ name: "Albumin 20%", kcal: 0.8, protein: 0.2 }, { name: "Albumin 5%", kcal: 0, protein: 0.05 }],
            "Kristalloider med elektrolyter": [{ name: "Glukos 50 mg/ml med El", kcal: 0.2 }, { name: "Glukos 100 mg/ml med el", kcal: 0.4 }, { name: "NaCl Picco-Kalibrering", kcal: 0 }, { name: "Natriumbikarbonat 50 mg/ml", kcal: 0 }, { name: "Natriumklorid 9 mg/ml", kcal: 0 }, { name: "Natriumklorid hyperton", kcal: 0 }, { name: "Plasmolyte", kcal: 0 }, { name: "Ringer-Acetat", kcal: 0 }]
        }
    },
    medicine: {
        placeholder: 'Välj läkemedelsvätska', customOption: 'Övrigt läkemedel',
        categories: {
            "Sedering": [{ name: "Dexdor", kcal: 0 }, { name: "Esketamin", kcal: 0 }, { name: "Klonidin", kcal: 0 }, { name: "Midazolam", kcal: 0 }, { name: "Propofol 10mg/ml", kcal: 1.1 }, { name: "Propofol 20mg/ml", kcal: 1.1 }, { name: "Remifentanil", kcal: 0 }],
            "Antibiotika": [{ name: "Pip/Taz 4g x 3", kcal: 0, defaultMl: 60 }, { name: "Vancomycin 1g x 1", kcal: 0, defaultMl: 270 }, { name: "Övrig Antibiotika", kcal: 0 }, { name: "Kaspofungin", kcal: 0, defaultMl: 250 }],
            "Vasoaktiva": [{ name: "Adrenalin", kcal: 0 }, { name: "Argipressin", kcal: 0 }, { name: "Dobutamin", kcal: 0 }, { name: "Levosimendan", kcal: 0.2 }, { name: "Milrinon", kcal: 0 }, { name: "Noradrenalin", kcal: 0 }],
            "Övrigt": [{ name: "Amiodarone", kcal: 0.2 }, { name: "EDA", kcal: 0 }, { name: "Kalium/Kaliumklorid", kcal: 0 }, { name: "Lispro", kcal: 0 }, { name: "Paracetamol", kcal: 0 }]
        }
    },
    bloodProduct: { placeholder: 'Välj blodprodukt', options: ['Erytrocyter', 'Trombocyter', 'Plasma'] },
    tpnSondmat: {
        placeholder: 'Välj TPN/Sondmat/Peroralt', customOption: 'Övrigt',
        options: [
            { name: "Peroralt intag", kcal: 0 },
            { name: "Övrigt protein", kcal: 0, isProteinSupplement: true } 
        ],
        categories: {
            "TPN": [
                { name: "Smof Kabiven extra nitrogen 900 kcal", kcal: 0.9, protein: 0.07 },
                { name: "Smof Kabiven 1100 kcal", kcal: 1.1, protein: 0.05 },
                { name: "Smof Kabiven – extra nitrogen 1350 kcal", kcal: 0.9, protein: 0.07 },
                { name: "Smof Kabiven 1600 kcal", kcal: 1.0, protein: 0.05 },
                { name: "Smof Kabiven extra nitrogen 1800 kcal", kcal: 1.1, protein: 0.07 },
                { name: "Smof Kabiven 2200 kcal", kcal: 1.1, protein: 0.05 },
                { name: "Smof Kabiven perifer", kcal: 0.7, protein: 0.03 },
                { name: "Smof Kabiven PI 1300 kcal", kcal: 0.68, protein: 0.03 }
            ],
            "Sondmat": [
                { name: "Isosource Standard Fibre", kcal: 1.03, protein: 0.039, waterFactor: 0.80 },
                { name: "Isosource Standard", kcal: 1.0, protein: 0.039, waterFactor: 0.85 },
                { name: "Isosource Protein Fibre", kcal: 1.33, protein: 0.067, waterFactor: 0.79 },
                { name: "Fresubin 2 kcal HP Fibre", kcal: 2.0, protein: 0.10, waterFactor: 0.72 },
                { name: "Fresubin 2 kcal HP", kcal: 2.0, protein: 0.10, waterFactor: 0.72 },
                { name: "Vatten i sond", kcal: 0, protein: 0 }
            ],
            "Näringsdryck": [
                { name: "Fresubin PRO drink", kcal: 2.4, protein: 0.14 },
                { name: "Fresubin Diben", kcal: 1.5, protein: 0.08 },
                { name: "Fresubin Xtra", kcal: 1.5, protein: 0.04 },
                { name: "Fresubin Thickened II", kcal: 1.5, protein: 0.10 },
                { name: "Calogen extra shot", kcal: 4.0, protein: 0.05 }
            ]
        }
    },
    loss: { placeholder: 'Välj förlusttyp', customOption: 'Annan förlust', options: ['Avföring', 'Blödning', 'Dialys (CRRT)', 'Dialys (IHD)', 'Diures', 'Drän 1', 'Drän 2', 'Drän 3', 'Kräkning', 'Sond', 'Stomi', 'Thoraxdrän hö', 'Thoraxdrän vä', 'VAC-pump'] }
};
