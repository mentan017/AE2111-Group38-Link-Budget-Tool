const speedOfLight = 299792458;
const boltzmann = 1.380649e-23;

function getInputs() {
  // Helper to get the raw trimmed string from an input/select
  const getRaw = (id) => document.getElementById(id).value.trim();

  // Helper to get the selected unit from the <select> right next to the <input>
  const getUnit = (inputId) => {
    const el = document.getElementById(inputId).nextElementSibling;
    return el && el.tagName === "SELECT" ? el.value : null;
  };

  // 1. Validate that all required fields have a value (everything except elongation-angle)
  const requiredIds = [
    "planet",
    "orbit-altitude",
    "elevation-angle",
    "sc-total-power",
    "sc-tx-power",
    "gs-tx-power",
    "dl-freq",
    "turnaround-ratio",
    "sc-ant-diam",
    "gs-ant-diam",
    "ant-rad-eff",
    "pointing-offset",
    "loss-tx",
    "loss-rx",
    "gs-tsys",
    "sc-tsys",
    "atm-attenuation",
    "swath-angle",
    "pixel-size",
    "bits-per-pixel",
    "duty-cycle",
    "downlink-time",
    "compression-ratio",
    "line-rate",
    "modulation",
    "coding",
    "req-ber",
    "ul-data-rate",
    "proto-dlp",
    "proto-net",
    "proto-overhead",
    "gs-pointing-error"
  ];

  for (const id of requiredIds) {
    if (getRaw(id) === "") {
      window.alert(`Missing required input: ${id}`);
      return 0; // Return 0 if any required field is empty
    }
  }

  // 2. Read & Convert Mission & Geometry
  const planet = getRaw("planet");

  // Orbit Altitude -> m
  let orbitAltitude = parseFloat(getRaw("orbit-altitude"));
  if (getUnit("orbit-altitude") === "km") orbitAltitude *= 1000;
  if(planet != "earth"){
    if(planet === "moon"){
        orbitAltitude += 384399000;
    }else if(planet === "mars"){
        orbitAltitude += 228e9;
    }else if(planet === "mercury"){
        orbitAltitude += 155e9;
    }
  }

  // Elongation Angle -> deg (Default to 0 if empty)
  const rawElongation = getRaw("elongation-angle");
  let elongationAngle = rawElongation === "" ? 0 : parseFloat(rawElongation);
  if (rawElongation !== "" && getUnit("elongation-angle") === "rad") {
    elongationAngle *= (180 / Math.PI);
  }

  // Antenna Elevation Angle -> deg
  let elevationAngle = parseFloat(getRaw("elevation-angle"));
  if (getUnit("elevation-angle") === "rad") {
    elevationAngle *= (180 / Math.PI);
  }

  // 3. Read & Convert Power & RF Channel
  // Power -> dBW: 10 * log10(P_Watts)
  let scTotalPower = parseFloat(getRaw("sc-total-power"));
  if (getUnit("sc-total-power") === "W") {
    scTotalPower = 10 * Math.log10(scTotalPower);
  }

  let scTxPower = parseFloat(getRaw("sc-tx-power"));
  if (getUnit("sc-tx-power") === "W") {
    scTxPower = 10 * Math.log10(scTxPower);
  }

  let gsTxPower = parseFloat(getRaw("gs-tx-power"));
  if (getUnit("gs-tx-power") === "W") {
    gsTxPower = 10 * Math.log10(gsTxPower);
  }

  // Downlink Frequency -> Hz
  let dlFreq = parseFloat(getRaw("dl-freq"));
  const dlFreqUnit = getUnit("dl-freq");
  if (dlFreqUnit === "GHz") dlFreq *= 1e9;
  else if (dlFreqUnit === "MHz") dlFreq *= 1e6;

  // Turn Around Ratio (supports "221/240" fraction string or decimal)
  const rawTurnaround = getRaw("turnaround-ratio");
  let turnaroundRatio;
  if (rawTurnaround.includes("/")) {
    const parts = rawTurnaround.split("/");
    turnaroundRatio = parseFloat(parts[0]) / parseFloat(parts[1]);
  } else {
    turnaroundRatio = parseFloat(rawTurnaround);
  }

  // 4. Read & Convert Antennas, System Temps & Losses
  const scAntDiam = parseFloat(getRaw("sc-ant-diam")); // m
  const gsAntDiam = parseFloat(getRaw("gs-ant-diam")); // m
  const antRadEff = parseFloat(getRaw("ant-rad-eff")); // Factor (-)

  // Pointing Offset Angle -> deg
  let pointingOffset = parseFloat(getRaw("pointing-offset"));
  if (getUnit("pointing-offset") === "arcmin") {
    pointingOffset /= 60;
  }

  // Convert Linear Loss Factors (e.g., 0.8, 0.7) to positive dB loss magnitudes
  const lossTxFactor = parseFloat(getRaw("loss-tx"));
  const lossRxFactor = parseFloat(getRaw("loss-rx"));
  const lossTx = -10 * Math.log10(lossTxFactor); // dB
  const lossRx = -10 * Math.log10(lossRxFactor); // dB

  // System Noise Temperatures -> K
  let gsTsys = parseFloat(getRaw("gs-tsys"));
  if (getUnit("gs-tsys") === "dBK") {
    gsTsys = Math.pow(10, gsTsys / 10);
  }

  let scTsys = parseFloat(getRaw("sc-tsys"));
  if (getUnit("sc-tsys") === "dBK") {
    scTsys = Math.pow(10, scTsys / 10);
  }

  // Atmospheric Attenuation -> dB
  let atmAttenuation = parseFloat(getRaw("atm-attenuation"));
  if (getUnit("atm-attenuation") === "factor") {
    if(dlFreq>=30e9){
      switch (atmAttenuation) {
        case 0: atmAttenuation = 0.124; break;
        case 0.1: atmAttenuation = 0.237; break;
        case 0.2: atmAttenuation = 0.264; break;
        case 0.25: atmAttenuation = 0.275; break;
        case 0.3: atmAttenuation = 0.287; break;
        case 0.4: atmAttenuation = 0.307; break;
        case 0.5: atmAttenuation = 0.327; break;
        case 0.6: atmAttenuation = 0.349; break;
        case 0.7: atmAttenuation = 0.377; break;
        case 0.8: atmAttenuation = 0.429; break;
        case 0.85: atmAttenuation = 0.477; break;
        case 0.9: atmAttenuation = 0.548; break;
        case 0.92: atmAttenuation = 0.606; break;
        case 0.93: atmAttenuation = 0.656; break;
        case 0.94: atmAttenuation = 0.741; break;
        case 0.95: atmAttenuation = 0.861; break;
        case 0.96: atmAttenuation = 1.040; break;
        case 0.97: atmAttenuation = 1.295; break;
        case 0.98: atmAttenuation = 1.679; break;
        case 0.99: atmAttenuation = 2.520; break;
        default: atmAttenuation = 0.548; // Defaults at CD = 0.90
      }
    }else if(dlFreq >= 6e9){ // X-band
      switch (atmAttenuation) {
        case 0: atmAttenuation = 0.039; break;
        case 0.1: atmAttenuation = 0.047; break;
        case 0.2: atmAttenuation = 0.049; break;
        case 0.25: atmAttenuation = 0.049; break;
        case 0.3: atmAttenuation = 0.050; break;
        case 0.4: atmAttenuation = 0.052; break;
        case 0.5: atmAttenuation = 0.053; break;
        case 0.6: atmAttenuation = 0.055; break;
        case 0.7: atmAttenuation = 0.057; break;
        case 0.8: atmAttenuation = 0.060; break;
        case 0.85: atmAttenuation = 0.063; break;
        case 0.9: atmAttenuation = 0.068; break;
        case 0.92: atmAttenuation = 0.072; break;
        case 0.93: atmAttenuation = 0.076; break;
        case 0.94: atmAttenuation = 0.082; break;
        case 0.95: atmAttenuation = 0.090; break;
        case 0.96: atmAttenuation = 0.102; break;
        case 0.97: atmAttenuation = 0.120; break;
        case 0.98: atmAttenuation = 0.147; break;
        case 0.99: atmAttenuation = 0.205; break;
        default: atmAttenuation = 0.068; // Defaults at CD = 0.90
      }
    }else{
      switch (atmAttenuation) {
        case 0: atmAttenuation = 0.036; break;
        case 0.1: atmAttenuation = 0.036; break;
        case 0.2: atmAttenuation = 0.036; break;
        case 0.25: atmAttenuation = 0.036; break;
        case 0.3: atmAttenuation = 0.036; break;
        case 0.4: atmAttenuation = 0.036; break;
        case 0.5: atmAttenuation = 0.037; break;
        case 0.6: atmAttenuation = 0.037; break;
        case 0.7: atmAttenuation = 0.037; break;
        case 0.8: atmAttenuation = 0.037; break;
        case 0.85: atmAttenuation = 0.037; break;
        case 0.9: atmAttenuation = 0.038; break;
        case 0.92: atmAttenuation = 0.038; break;
        case 0.93: atmAttenuation = 0.038; break;
        case 0.94: atmAttenuation = 0.039; break;
        case 0.95: atmAttenuation = 0.039; break;
        case 0.96: atmAttenuation = 0.040; break;
        case 0.97: atmAttenuation = 0.042; break;
        case 0.98: atmAttenuation = 0.043; break;
        case 0.99: atmAttenuation = 0.048; break;
        default: atmAttenuation = 0.038; // Defaults at CD = 0.90
      }
    }
  }
  // Ground Station Pointing Error -> deg
  let gsPointingError = parseFloat(getRaw("gs-pointing-error"));
  if(getUnit("gs-pointing-error") === "factor"){
    switch (gsPointingError){
      case 0: gsPointingError = 0; break;
      case 0.1: gsPointingError = 0.366; break;
      case 0.2: gsPointingError = 0.533; break;
      case 0.3: gsPointingError = 0.673; break;
      case 0.4: gsPointingError = 0.806; break;
      case 0.5: gsPointingError = 0.939; break;
      case 0.545: gsPointingError = 1; break;
      case 0.6: gsPointingError = 1.08; break;
      case 0.7: gsPointingError = 1.238; break;
      case 0.8: gsPointingError = 1.431; break;
      case 0.9: gsPointingError = 1.712; break;
      case 0.95: gsPointingError = 1.953; break;
      case 0.98: gsPointingError = 2.232; break;
      case 0.99: gsPointingError = 2.421; break;
      default: gsPointingError = 1.712; // Defaults at CD = 0.90
    }
    if(dlFreq >= 30e9){
      gsPointingError*=0.0042;
    }else{
      gsPointingError*=0.006;
    }
  }

  // 5. Read & Convert Payload & Data Generation
  // Swath Width Angle -> deg
  let PLSwathAngle = parseFloat(getRaw("swath-angle"));
  if (getUnit("swath-angle") === "rad") {
    PLSwathAngle *= (180 / Math.PI);
  }

  // Pixel Size -> deg
  let PLPixelSize = parseFloat(getRaw("pixel-size"));
  if (getUnit("pixel-size") === "arcmin") {
    PLPixelSize /= 60;
  }

  const PLBitsPerPixel = parseFloat(getRaw("bits-per-pixel")); // bits/px

  // Duty Cycle -> Factor (-)
  let dutyCycle = parseFloat(getRaw("duty-cycle"));
  if (getUnit("duty-cycle") === "pct") {
    dutyCycle /= 100;
  }

  // Payload Downlink Time per Day -> s/day
  let downlinkTime = parseFloat(getRaw("downlink-time"));
  if (getUnit("downlink-time") === "hr") {
    downlinkTime *= 3600;
  }

  const compressionRatio = parseFloat(getRaw("compression-ratio")); // Factor (-)

  // Line Rate -> Hz (lines/s)
  let lineRate = parseFloat(getRaw("line-rate"));
  if (getUnit("line-rate") === "klps") {
    lineRate *= 1000;
  }

  // Uplink Data Rate -> bit/s
  let ulDataRate = parseFloat(getRaw("ul-data-rate"));
  if (getUnit("ul-data-rate") === "kbps") {
    ulDataRate *= 1000;
  }

  // 6. Untreated Values: Modulation, Coding, Link Quality & Protocols
  const modulation = getRaw("modulation");
  const coding = getRaw("coding");
  const reqBer = getRaw("req-ber");
  const protoDlp = getRaw("proto-dlp");
  const protoNet = getRaw("proto-net");
  const protoOverhead = getRaw("proto-overhead");
  const protoOverheadUnit = getUnit("proto-overhead");

  // 7. Return JSON-compatible object with all values
  return {
    planet,
    orbitAltitude,
    elongationAngle,
    elevationAngle,
    scTotalPower,
    scTxPower,
    gsTxPower,
    dlFreq,
    turnaroundRatio,
    scAntDiam,
    gsAntDiam,
    antRadEff,
    pointingOffset,
    lossTx,
    lossRx,
    gsTsys,
    scTsys,
    atmAttenuation,
    PLSwathAngle,
    PLPixelSize,
    PLBitsPerPixel,
    dutyCycle,
    downlinkTime,
    compressionRatio,
    lineRate,
    ulDataRate,
    modulation,
    coding,
    reqBer,
    protoDlp,
    protoNet,
    protoOverhead,
    protoOverheadUnit,
    gsPointingError
  };
}

function computePayloadOutputs(inp) {
  // 1. Payload Data & Bit Rates
  const imageSize = (inp.PLSwathAngle * inp.PLBitsPerPixel) / inp.PLPixelSize;
  const payloadGeneratedDataRate = imageSize * inp.lineRate;
  const dataCollectedRaw = 24 * 3600 * inp.dutyCycle * payloadGeneratedDataRate;
  const dataCollectedCompressed = dataCollectedRaw / inp.compressionRatio;
  const dlRequiredDataRate = dataCollectedCompressed / inp.downlinkTime;

  // 2. Downlink Calculations (Space-to-Earth)
  const DlSCAntennaGain = 10 * Math.log10(
    inp.antRadEff * Math.pow((Math.PI * inp.scAntDiam * inp.dlFreq) / speedOfLight, 2)
  );
  const DlGSAntennaGain = 10 * Math.log10(
    inp.antRadEff * Math.pow((Math.PI * inp.gsAntDiam * inp.dlFreq) / speedOfLight, 2)
  );

  const DlTransmitterPower = inp.scTxPower;
  const DlCircuitLossTx = inp.lossTx;
  const DlPointingLossTx = 12 * Math.pow((inp.pointingOffset * inp.dlFreq * inp.scAntDiam) / (21 * 1e9), 2);
  const DlEIRP = DlTransmitterPower - DlCircuitLossTx + DlSCAntennaGain - DlPointingLossTx;

  const DlFSL = 10 * Math.log10(Math.pow((4 * Math.PI * inp.orbitAltitude * inp.dlFreq) / speedOfLight, 2));
  const DlAtmosphericAttenuation = inp.atmAttenuation / Math.sin(inp.elevationAngle * (Math.PI / 180));

  const DlPointingLossRx = 12 * Math.pow((inp.gsPointingError * inp.dlFreq * inp.gsAntDiam) / (21 * 1e9), 2);

  const DlCircuitLossRx = inp.lossRx;
  const DlSystemNoiseSpectralDensity = 10 * Math.log10(boltzmann * inp.gsTsys);

  const DlReceivedEbN0 =
    DlEIRP -
    DlFSL -
    DlAtmosphericAttenuation +
    DlGSAntennaGain -
    DlPointingLossRx -
    DlCircuitLossRx -
    DlSystemNoiseSpectralDensity - 10 * Math.log10(dlRequiredDataRate);
  const DlRequiredEbN0 = getRequiredEbN0(inp.modulation, inp.coding, inp.reqBer);
  const DlMargin = DlReceivedEbN0 - DlRequiredEbN0;

  // 3. Uplink Calculations (Earth-to-Space)
  const UlFreq = inp.dlFreq * inp.turnaroundRatio;
  const UlWavelength = speedOfLight / UlFreq;

  const UlSCAntennaGain = 10 * Math.log10(
    inp.antRadEff * Math.pow((Math.PI * inp.scAntDiam) / UlWavelength, 2)
  );
  const UlGSAntennaGain = 10 * Math.log10(
    inp.antRadEff * Math.pow((Math.PI * inp.gsAntDiam) / UlWavelength, 2)
  );

  const UlTransmitterPower = inp.gsTxPower;
  const UlCircuitLossTx = inp.lossTx;
  const UlPointingLossTx = 12 * Math.pow((inp.gsPointingError * UlFreq * inp.gsAntDiam) / (21 * 1e9), 2);

  const UlEIRP = UlTransmitterPower - UlCircuitLossTx + UlGSAntennaGain - UlPointingLossTx;
  const UlFSL = 10 * Math.log10(Math.pow((4 * Math.PI * inp.orbitAltitude * UlFreq) / speedOfLight, 2));
  const UlAtmosphericAttenuation = inp.atmAttenuation / Math.sin(inp.elevationAngle * (Math.PI / 180));

  const UlPointingLossRx = 12 * Math.pow((inp.pointingOffset * UlFreq * inp.scAntDiam) / (21 * 1e9), 2);
  const UlCircuitLossRx = inp.lossRx;
  const UlSystemNoiseSpectralDensity = 10 * Math.log10(boltzmann * inp.scTsys);


  const UlReceivedEbN0 =
    UlEIRP -
    UlFSL -
    UlAtmosphericAttenuation +
    UlSCAntennaGain -
    UlPointingLossRx -
    UlCircuitLossRx -
    UlSystemNoiseSpectralDensity - 10 * Math.log10(inp.ulDataRate);
  const UlRequiredEbN0 = getRequiredEbN0(inp.modulation, inp.coding, inp.reqBer);
  const UlMargin = UlReceivedEbN0 - UlRequiredEbN0;

  return {
    lineRate: inp.lineRate,
    orbitAltitude: inp.orbitAltitude,
    payloadGeneratedDataRate,
    dataCollectedRaw,
    dataCollectedCompressed,
    dlRequiredDataRate,

    DlSCAntennaGain,
    DlGSAntennaGain,
    DlTransmitterPower,
    DlCircuitLossTx,
    DlEIRP,
    DlPointingLossTx,
    DlFSL,
    DlAtmosphericAttenuation,
    DlPointingLossRx,
    DlCircuitLossRx,
    DlSystemNoiseSpectralDensity,
    DlReceivedEbN0,
    DlRequiredEbN0,
    DlMargin,

    UlDataRate: inp.ulDataRate,
    UlFreq,
    UlSCAntennaGain,
    UlGSAntennaGain,
    UlTransmitterPower,
    UlCircuitLossTx,
    UlPointingLossTx,
    UlEIRP,
    UlFSL,
    UlAtmosphericAttenuation,
    UlPointingLossRx,
    UlCircuitLossRx,
    UlSystemNoiseSpectralDensity,
    UlReceivedEbN0,
    UlRequiredEbN0,
    UlMargin
  };
}

function displayOutputs(out) {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const setHTML = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  // --- 1. Downlink KPI Cards ---
  setHTML("kpi-dl-eirp", `${out.DlEIRP.toFixed(2)} <small>dBW</small>`);
  setText("kpi-dl-eirp-sub", `${(out.DlEIRP + 30).toFixed(1)} dBm / ${Math.pow(10, out.DlEIRP / 10).toFixed(1)} W`);
  setHTML("kpi-dl-fsl", `-${out.DlFSL.toFixed(2)} <small>dB</small>`);
  setText("kpi-dl-fsl-sub", `Range: ${(out.orbitAltitude / 1000).toFixed(0)} km`);
  setHTML("kpi-dl-ebn0", `${out.DlReceivedEbN0.toFixed(2)} <small>dB</small>`);
  setText("kpi-dl-ebn0-sub", `Req: ${out.DlRequiredEbN0.toFixed(2)} dB`);
  setHTML("kpi-dl-margin", `${out.DlMargin.toFixed(2)} <small>dB</small>`);

  // --- 2. Downlink Payload Data Table ---
  setText("out-dl-raw-bits", out.dataCollectedRaw.toExponential(2));
  setText("out-dl-raw-gb", (out.dataCollectedRaw / (8 * Math.pow(1024, 3))).toFixed(2) + " GB");
  setText("out-dl-comp-bits", out.dataCollectedCompressed.toExponential(2));
  setText("out-dl-comp-gb", (out.dataCollectedCompressed / (8 * Math.pow(1024, 3))).toFixed(2) + " GB");
  setText("out-dl-line-rate", out.lineRate.toFixed(1));
  setText("out-dl-line-rate-khz", (out.lineRate / 1000).toFixed(2) + " kHz");
  setText("out-dl-gen-rate", out.payloadGeneratedDataRate.toExponential(2));
  setText("out-dl-gen-rate-mbps", (out.payloadGeneratedDataRate / 1e6).toFixed(2) + " Mbps");
  setText("out-dl-req-rate", out.dlRequiredDataRate.toExponential(2));
  setText("out-dl-req-rate-dbhz", ((out.dlRequiredDataRate)/1e6).toFixed(2) + " Mbps");

  // --- 3. Downlink Link Budget Breakdown Table ---
  setText("out-dl-tx-power", out.DlTransmitterPower.toFixed(2));
  setText("out-dl-loss-tx", `-${out.DlCircuitLossTx.toFixed(2)}`);
  setText("out-dl-sc-gain", out.DlSCAntennaGain.toFixed(2));
  setText("out-dl-pointing-tx", `-${out.DlPointingLossTx.toFixed(2)}`);
  setText("out-dl-eirp", out.DlEIRP.toFixed(2));
  setText("out-dl-fsl", `-${out.DlFSL.toFixed(2)}`);
  setText("out-dl-atm-loss", `-${out.DlAtmosphericAttenuation.toFixed(2)}`);
  setText("out-dl-gs-gain", out.DlGSAntennaGain.toFixed(2));
  setText("out-dl-pointing-rx", `-${out.DlPointingLossRx.toFixed(2)}`);
  setText("out-dl-loss-rx", `-${out.DlCircuitLossRx.toFixed(2)}`);
  setText("out-dl-noise-density", out.DlSystemNoiseSpectralDensity.toFixed(2));
  setText("out-dl-ebn0", out.DlReceivedEbN0.toFixed(2));
  setText("out-dl-req-ebn0", out.DlRequiredEbN0.toFixed(2));
  setText("out-dl-margin", out.DlMargin.toFixed(2));

  // --- 4. Uplink KPI Cards ---
  setHTML("kpi-ul-eirp", `${out.UlEIRP.toFixed(2)} <small>dBW</small>`);
  setText("kpi-ul-eirp-sub", `${(out.UlEIRP + 30).toFixed(1)} dBm / ${Math.pow(10, out.UlEIRP / 10).toFixed(1)} W`);
  setHTML("kpi-ul-fsl", `-${out.UlFSL.toFixed(2)} <small>dB</small>`);
  setText("kpi-ul-fsl-sub", `Freq: ${(out.UlFreq / 1e9).toFixed(2)} GHz`);
  setHTML("kpi-ul-ebn0", `${out.UlReceivedEbN0.toFixed(2)} <small>dB</small>`);
  setText("kpi-ul-ebn0-sub", `Req: ${out.UlRequiredEbN0.toFixed(2)} dB`);
  setHTML("kpi-ul-margin", `${out.UlMargin.toFixed(2)} <small>dB</small>`);

  // --- 5. Uplink Telecommand Data Table ---
  setText("out-ul-req-rate", out.UlDataRate.toExponential(2));
  setText("out-ul-req-rate-dbhz", ((out.UlDataRate)/1e6).toFixed(2) + " Mpbs");
  setText("out-ul-freq", (out.UlFreq / 1e9).toFixed(3));
  setText("out-ul-freq-mhz", (out.UlFreq / 1e6).toFixed(1) + " MHz");
  setText("out-ul-sym-rate", out.UlDataRate.toExponential(2));
  setText("out-ul-sym-rate-ksps", (out.UlDataRate / 1e3).toFixed(1) + " ksps");

  // --- 6. Uplink Link Budget Breakdown Table ---
  setText("out-ul-tx-power", out.UlTransmitterPower.toFixed(2));
  setText("out-ul-loss-tx", `-${out.UlCircuitLossTx.toFixed(2)}`);
  setText("out-ul-gs-gain", out.UlGSAntennaGain.toFixed(2));
  setText("out-ul-pointing-tx", `-${out.UlPointingLossTx.toFixed(2)}`);
  setText("out-ul-eirp", out.UlEIRP.toFixed(2));
  setText("out-ul-fsl", `-${out.UlFSL.toFixed(2)}`);
  setText("out-ul-atm-loss", `-${out.UlAtmosphericAttenuation.toFixed(2)}`);
  setText("out-ul-sc-gain", out.UlSCAntennaGain.toFixed(2));
  setText("out-ul-pointing-rx", `-${out.UlPointingLossRx.toFixed(2)}`);
  setText("out-ul-loss-rx", `-${out.UlCircuitLossRx.toFixed(2)}`);
  setText("out-ul-noise-density", out.UlSystemNoiseSpectralDensity.toFixed(2));
  setText("out-ul-ebn0", out.UlReceivedEbN0.toFixed(2));
  setText("out-ul-req-ebn0", out.UlRequiredEbN0.toFixed(2));
  setText("out-ul-margin", out.UlMargin.toFixed(2));
}

document.addEventListener("DOMContentLoaded", () => {
  const calcBtn = document.getElementById("calc-btn");
  const modSelect = document.getElementById("modulation");

  updateCodingOptions();
  modSelect.addEventListener("change", updateCodingOptions);
  
  calcBtn.addEventListener("click", () => {
    const inputs = getInputs();
    if (inputs === 0) {
      console.log("Missing some inputs");
    } else {
      const outputs = computePayloadOutputs(inputs);
      console.log(outputs);
      displayOutputs(outputs);
    }
  });
});
// =========================================================================
// CCSDS 130.1-G-3 Required Eb/N0 Lookup Table (in dB)
// =========================================================================
const biphaseCodingData = {
  // 1. Uncoded
  "uncoded": { label: "Uncoded (r=1)", rate: 1.0, "1e-5": 9.60, "1e-6": 10.50 },

  // 2. Convolutional Codes (K=7)
  "cc-1/2-unq": { label: "Convolutional (7, 1/2) - Unquantized Soft (D=60)", rate: 1/2, "1e-5": 4.25, "1e-6": 4.90 },
  "cc-1/2-8b-s1": { label: "Convolutional (7, 1/2) - 8-Bit Soft (Strategy 1)", rate: 1/2, "1e-5": 4.35, "1e-6": 5.00 },
  "cc-1/2-6b-s2": { label: "Convolutional (7, 1/2) - 6-Bit Soft (Strategy 2)", rate: 1/2, "1e-5": 4.25, "1e-6": 4.90 },
  "cc-1/2-3b-s1": { label: "Convolutional (7, 1/2) - 3-Bit Soft (Strategy 1)", rate: 1/2, "1e-5": 4.60, "1e-6": 5.30 },
  "cc-1/2-3b-s2": { label: "Convolutional (7, 1/2) - 3-Bit Soft (Strategy 2)", rate: 1/2, "1e-5": 4.50, "1e-6": 5.15 },
  "cc-1/2-hard": { label: "Convolutional (7, 1/2) - Hard Decision", rate: 1/2, "1e-5": 6.50, "1e-6": 7.10 },
  "cc-2/3": { label: "Punctured Convolutional (7, 2/3) - D=60", rate: 2/3, "1e-5": 4.90, "1e-6": 5.50 },
  "cc-3/4": { label: "Punctured Convolutional (7, 3/4) - D=60", rate: 3/4, "1e-5": 5.35, "1e-6": 6.00 },
  "cc-5/6-d60": { label: "Punctured Convolutional (7, 5/6) - D=60", rate: 5/6, "1e-5": 5.85, "1e-6": 6.50 },
  "cc-5/6-d90": { label: "Punctured Convolutional (7, 5/6) - D=90 (Ideal)", rate: 5/6, "1e-5": 5.70, "1e-6": 6.30 },
  "cc-7/8-d60": { label: "Punctured Convolutional (7, 7/8) - D=60", rate: 7/8, "1e-5": 6.45, "1e-6": 7.15 },
  "cc-7/8-d120": { label: "Punctured Convolutional (7, 7/8) - D=90..120 (Ideal)", rate: 7/8, "1e-5": 6.05, "1e-6": 6.65 },

  // 3. Reed-Solomon (RS) Codes
  "rs-255-223": { label: "Reed-Solomon (255,223) E=16", rate: 223/255, "1e-5": 6.15, "1e-6": 6.38 },
  "rs-255-239": { label: "Reed-Solomon (255,239) E=8", rate: 239/255, "1e-5": 6.80, "1e-6": 7.08 },
  "rs-157-125": { label: "Reed-Solomon (157,125) E=16 Shortened", rate: 125/157, "1e-5": 6.05, "1e-6": 6.28 },
  "rs-204-188": { label: "Reed-Solomon (204,188) E=8 Shortened", rate: 188/204, "1e-5": 6.72, "1e-6": 7.00 },
  "rs-97-81": { label: "Reed-Solomon (97,81) E=8 Shortened", rate: 81/97, "1e-5": 6.52, "1e-6": 6.82 },
  "rs-255-173": { label: "Reed-Solomon (255,173) E=41 Non-Standard", rate: 173/255, "1e-5": 5.65, "1e-6": 5.83 },

  // 4. Concatenated RS(255,223) [E=16] + Convolutional
  "concat-e16-1/2-i1": { label: "RS(255,223) + CC(7, 1/2), I=1", rate: 0.437, "1e-5": 2.80, "1e-6": 3.00 },
  "concat-e16-1/2-i2": { label: "RS(255,223) + CC(7, 1/2), I=2", rate: 0.437, "1e-5": 2.52, "1e-6": 2.65 },
  "concat-e16-1/2-i3": { label: "RS(255,223) + CC(7, 1/2), I=3", rate: 0.437, "1e-5": 2.40, "1e-6": 2.51 },
  "concat-e16-1/2-i4": { label: "RS(255,223) + CC(7, 1/2), I=4", rate: 0.437, "1e-5": 2.35, "1e-6": 2.45 },
  "concat-e16-1/2-i5": { label: "RS(255,223) + CC(7, 1/2), I=5", rate: 0.437, "1e-5": 2.34, "1e-6": 2.43 },
  "concat-e16-1/2-ideal": { label: "RS(255,223) + CC(7, 1/2), I=8..16 (Ideal)", rate: 0.437, "1e-5": 2.30, "1e-6": 2.39 },
  "concat-e16-2/3-i5": { label: "RS(255,223) + Punct. CC(7, 2/3), I=5", rate: 0.583, "1e-5": 3.03, "1e-6": 3.12 },
  "concat-e16-3/4-i5": { label: "RS(255,223) + Punct. CC(7, 3/4), I=5", rate: 0.656, "1e-5": 3.58, "1e-6": 3.68 },
  "concat-e16-3/4-ideal": { label: "RS(255,223) + Punct. CC(7, 3/4), I=16 (Ideal)", rate: 0.656, "1e-5": 3.48, "1e-6": 3.55 },
  "concat-e16-5/6-i5": { label: "RS(255,223) + Punct. CC(7, 5/6), I=5", rate: 0.729, "1e-5": 4.32, "1e-6": 4.45 },
  "concat-e16-7/8-i5": { label: "RS(255,223) + Punct. CC(7, 7/8), I=5", rate: 0.765, "1e-5": 4.90, "1e-6": 5.02 },
  "concat-e16-7/8-ideal": { label: "RS(255,223) + Punct. CC(7, 7/8), I=16 (Ideal)", rate: 0.765, "1e-5": 4.70, "1e-6": 4.82 },

  // 5. Concatenated RS(255,239) [E=8] + Convolutional
  "concat-e8-1/2-i1": { label: "RS(255,239) + CC(7, 1/2), I=1", rate: 0.469, "1e-5": 3.05, "1e-6": 3.30 },
  "concat-e8-1/2-i2": { label: "RS(255,239) + CC(7, 1/2), I=2", rate: 0.469, "1e-5": 2.68, "1e-6": 2.83 },
  "concat-e8-1/2-i3": { label: "RS(255,239) + CC(7, 1/2), I=3", rate: 0.469, "1e-5": 2.53, "1e-6": 2.66 },
  "concat-e8-1/2-i4": { label: "RS(255,239) + CC(7, 1/2), I=4", rate: 0.469, "1e-5": 2.47, "1e-6": 2.61 },
  "concat-e8-1/2-i5": { label: "RS(255,239) + CC(7, 1/2), I=5", rate: 0.469, "1e-5": 2.46, "1e-6": 2.59 },
  "concat-e8-1/2-ideal": { label: "RS(255,239) + CC(7, 1/2), I=8..16 (Ideal)", rate: 0.469, "1e-5": 2.45, "1e-6": 2.58 },
  "concat-e8-2/3-i5": { label: "RS(255,239) + Punct. CC(7, 2/3), I=5", rate: 0.625, "1e-5": 3.12, "1e-6": 3.25 },
  "concat-e8-3/4-i5": { label: "RS(255,239) + Punct. CC(7, 3/4), I=5", rate: 0.703, "1e-5": 3.68, "1e-6": 3.80 },
  "concat-e8-3/4-ideal": { label: "RS(255,239) + Punct. CC(7, 3/4), I=16 (Ideal)", rate: 0.703, "1e-5": 3.56, "1e-6": 3.66 },
  "concat-e8-5/6-i5": { label: "RS(255,239) + Punct. CC(7, 5/6), I=5", rate: 0.781, "1e-5": 4.43, "1e-6": 4.57 },
  "concat-e8-7/8-i5": { label: "RS(255,239) + Punct. CC(7, 7/8), I=5", rate: 0.820, "1e-5": 5.00, "1e-6": 5.15 },
  "concat-e8-7/8-ideal": { label: "RS(255,239) + Punct. CC(7, 7/8), I=16 (Ideal)", rate: 0.820, "1e-5": 4.83, "1e-6": 4.95 },

  // 6. Non-CCSDS Deep Space Concatenated
  "concat-ds-1/4-i5": { label: "RS(255,223) + CC(15, 1/4), I=5", rate: 0.219, "1e-5": 0.90, "1e-6": 1.00 },
  "concat-cassini-1/6-i1": { label: "RS(255,223) + CC(15, 1/6) [Cassini], I=1", rate: 0.146, "1e-5": 1.60, "1e-6": 1.80 },
  "concat-cassini-1/6-i5": { label: "RS(255,223) + CC(15, 1/6) [Cassini], I=5", rate: 0.146, "1e-5": 0.72, "1e-6": 0.82 },

  // 7. Turbo Codes (10 Iterations)
  "turbo-1/2-k1784": { label: "Turbo Code (r=1/2, k=1784)", rate: 1/2, "1e-5": 1.42, "1e-6": 1.53 },
  "turbo-1/3-k1784": { label: "Turbo Code (r=1/3, k=1784)", rate: 1/3, "1e-5": 0.77, "1e-6": 0.88 },
  "turbo-1/4-k1784": { label: "Turbo Code (r=1/4, k=1784)", rate: 1/4, "1e-5": 0.56, "1e-6": 0.65 },
  "turbo-1/6-k1784": { label: "Turbo Code (r=1/6, k=1784)", rate: 1/6, "1e-5": 0.27, "1e-6": 0.36 },

  "turbo-1/2-k3568": { label: "Turbo Code (r=1/2, k=3568)", rate: 1/2, "1e-5": 1.21, "1e-6": 1.30 },
  "turbo-1/3-k3568": { label: "Turbo Code (r=1/3, k=3568)", rate: 1/3, "1e-5": 0.56, "1e-6": 0.63 },
  "turbo-1/4-k3568": { label: "Turbo Code (r=1/4, k=3568)", rate: 1/4, "1e-5": 0.33, "1e-6": 0.41 },
  "turbo-1/6-k3568": { label: "Turbo Code (r=1/6, k=3568)", rate: 1/6, "1e-5": 0.06, "1e-6": 0.14 },

  "turbo-1/2-k7136": { label: "Turbo Code (r=1/2, k=7136)", rate: 1/2, "1e-5": 1.04, "1e-6": 1.11 },
  "turbo-1/3-k7136": { label: "Turbo Code (r=1/3, k=7136)", rate: 1/3, "1e-5": 0.41, "1e-6": 0.46 },
  "turbo-1/4-k7136": { label: "Turbo Code (r=1/4, k=7136)", rate: 1/4, "1e-5": 0.17, "1e-6": 0.23 },
  "turbo-1/6-k7136": { label: "Turbo Code (r=1/6, k=7136)", rate: 1/6, "1e-5": -0.09, "1e-6": -0.04 },

  "turbo-1/2-k8920": { label: "Turbo Code (r=1/2, k=8920)", rate: 1/2, "1e-5": 1.01, "1e-6": 1.07 },
  "turbo-1/3-k8920": { label: "Turbo Code (r=1/3, k=8920)", rate: 1/3, "1e-5": 0.36, "1e-6": 0.42 },
  "turbo-1/4-k8920": { label: "Turbo Code (r=1/4, k=8920)", rate: 1/4, "1e-5": 0.13, "1e-6": 0.18 },
  "turbo-1/6-k8920": { label: "Turbo Code (r=1/6, k=8920)", rate: 1/6, "1e-5": -0.13, "1e-6": -0.08 },

  "turbo-1/2-k16384": { label: "Turbo Code (r=1/2, k=16384)", rate: 1/2, "1e-5": 0.94, "1e-6": 0.99 },
  "turbo-1/3-k16384": { label: "Turbo Code (r=1/3, k=16384)", rate: 1/3, "1e-5": 0.30, "1e-6": 0.36 },
  "turbo-1/4-k16384": { label: "Turbo Code (r=1/4, k=16384)", rate: 1/4, "1e-5": 0.06, "1e-6": 0.17 },
  "turbo-1/6-k16384": { label: "Turbo Code (r=1/6, k=16384)", rate: 1/6, "1e-5": -0.18, "1e-6": -0.12 },

  // 8. LDPC Codes (AR4JA & Code C2)
  "ldpc-1/2-k16384": { label: "AR4JA LDPC (r=1/2, k=16384)", rate: 1/2, "1e-5": 0.92, "1e-6": 0.96 },
  "ldpc-1/2-k4096": { label: "AR4JA LDPC (r=1/2, k=4096)", rate: 1/2, "1e-5": 1.18, "1e-6": 1.26 },
  "ldpc-1/2-k1024": { label: "AR4JA LDPC (r=1/2, k=1024)", rate: 1/2, "1e-5": 1.72, "1e-6": 1.90 },

  "ldpc-2/3-k16384": { label: "AR4JA LDPC (r=2/3, k=16384)", rate: 2/3, "1e-5": 1.74, "1e-6": 1.78 },
  "ldpc-2/3-k4096": { label: "AR4JA LDPC (r=2/3, k=4096)", rate: 2/3, "1e-5": 1.98, "1e-6": 2.08 },
  "ldpc-2/3-k1024": { label: "AR4JA LDPC (r=2/3, k=1024)", rate: 2/3, "1e-5": 2.53, "1e-6": 2.75 },

  "ldpc-4/5-k16384": { label: "AR4JA LDPC (r=4/5, k=16384)", rate: 4/5, "1e-5": 2.68, "1e-6": 2.73 },
  "ldpc-4/5-k4096": { label: "AR4JA LDPC (r=4/5, k=4096)", rate: 4/5, "1e-5": 2.92, "1e-6": 3.05 },
  "ldpc-4/5-k1024": { label: "AR4JA LDPC (r=4/5, k=1024)", rate: 4/5, "1e-5": 3.58, "1e-6": 3.80 },

  "ldpc-7/8-c2": { label: "Code C2 LDPC (r=7/8, k=7136)", rate: 223/255, "1e-5": 3.77, "1e-6": 3.85 }
};

const apsk16CodingData = {
  // Section 8.2 (Fig. 8-2) 16-APSK + AR4JA LDPC (k=16384)
  "ldpc-1/2-k16384": { label: "AR4JA LDPC (r=1/2, k=16384)", rate: 1/2, "1e-5": 3.38, "1e-6": 3.38 },
  "ldpc-2/3-k16384": { label: "AR4JA LDPC (r=2/3, k=16384)", rate: 2/3, "1e-5": 4.74, "1e-6": 4.74 },
  "ldpc-4/5-k16384": { label: "AR4JA LDPC (r=4/5, k=16384)", rate: 4/5, "1e-5": 6.16, "1e-6": 6.16 }
};

const EBN0_DATABASE = {
  bpsk: biphaseCodingData,
  qpsk: biphaseCodingData,
  "16apsk": apsk16CodingData
};

/**
 * Returns the required Eb/N0 (in dB) for a given modulation, coding scheme, and target BER.
 * @param {string} mod - Modulation key ("bpsk", "qpsk", "16apsk")
 * @param {string} code - Coding scheme key (e.g., "uncoded", "turbo-1/2-k8920")
 * @param {string|number} BER - Target Bit Error Rate ("1e-5", "1e-6", 1e-5, 1e-6)
 * @returns {number} Required Eb/N0 in dB
 */
function getRequiredEbN0(mod, code, BER) {
  const modGroup = EBN0_DATABASE[mod];
  if (!modGroup || !modGroup[code]) {
    console.warn(`Combination not found for mod="${mod}", code="${code}". Defaulting to 10.50 dB.`);
    return 10.50;
  }

  // Normalize BER input to match "1e-5" or "1e-6" keys
  const berVal = parseFloat(BER);
  const berKey = berVal >= 1e-5 ? "1e-5" : "1e-6";

  return modGroup[code][berKey];
}

/**
 * Dynamically updates the Channel Coding <select> options when Modulation changes.
 */
function updateCodingOptions() {
  const modSelect = document.getElementById("modulation");
  const codingSelect = document.getElementById("coding");
  if (!modSelect || !codingSelect) return;

  const selectedMod = modSelect.value;
  const previousCode = codingSelect.value;
  const availableCodes = EBN0_DATABASE[selectedMod] || {};

  // Clear existing options
  codingSelect.innerHTML = "";

  // Populate new options for the chosen modulation
  for (const [codeKey, codeObj] of Object.entries(availableCodes)) {
    const opt = document.createElement("option");
    opt.value = codeKey;
    opt.textContent = codeObj.label;
    codingSelect.appendChild(opt);
  }

  // Keep the previously selected code if it exists in the new modulation list
  if (availableCodes[previousCode]) {
    codingSelect.value = previousCode;
  }
}