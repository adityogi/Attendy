import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler {
    var window: NSWindow!
    var webView: WKWebView!
    let dataFile = URL(fileURLWithPath: "/Users/roost/Downloads/Attendence/attendance_data.json")
    let htmlFile = URL(fileURLWithPath: "/Users/roost/Downloads/Attendence/app.html")
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1024, height: 768),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.center()
        window.title = "ClassTrack"
        
        let config = WKWebViewConfiguration()
        config.userContentController.add(self, name: "saveData")
        config.userContentController.add(self, name: "loadData")
        
        // Allow file access so local app.html can load local CSS/JS
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        
        // Load the local HTML file
        webView.loadFileURL(htmlFile, allowingReadAccessTo: htmlFile.deletingLastPathComponent())
        
        window.contentView?.addSubview(webView)
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "saveData", let jsonString = message.body as? String {
            do {
                try jsonString.write(to: dataFile, atomically: true, encoding: .utf8)
            } catch {
                print("Failed to save data: \(error)")
            }
        } else if message.name == "loadData" {
            do {
                let jsonString = try String(contentsOf: dataFile, encoding: .utf8)
                let escapedJson = jsonString.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "'", with: "\\'").replacingOccurrences(of: "\"", with: "\\\"").replacingOccurrences(of: "\n", with: "\\n")
                let script = "window.receiveNativeData(\"\(escapedJson)\");"
                webView.evaluateJavaScript(script, completionHandler: nil)
            } catch {
                // If file doesn't exist, send empty data to trigger fallback/defaults
                webView.evaluateJavaScript("window.receiveNativeData('');", completionHandler: nil)
            }
        }
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
