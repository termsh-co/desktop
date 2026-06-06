pub struct TrayLabels {
    pub show: &'static str,
    pub open_terminal: &'static str,
    pub quit: &'static str,
    pub tooltip: &'static str,
}

pub fn labels(locale: &str) -> TrayLabels {
    match locale {
        "tr" => TrayLabels {
            show: "termsh'u aç",
            open_terminal: "Terminal aç",
            quit: "Çıkış",
            tooltip: "termsh",
        },
        "zh" => TrayLabels {
            show: "打开 termsh",
            open_terminal: "打开终端",
            quit: "退出",
            tooltip: "termsh",
        },
        "es" => TrayLabels {
            show: "Abrir termsh",
            open_terminal: "Abrir terminal",
            quit: "Salir",
            tooltip: "termsh",
        },
        "de" => TrayLabels {
            show: "termsh öffnen",
            open_terminal: "Terminal öffnen",
            quit: "Beenden",
            tooltip: "termsh",
        },
        _ => TrayLabels {
            show: "Open termsh",
            open_terminal: "Open terminal",
            quit: "Quit",
            tooltip: "termsh",
        },
    }
}
