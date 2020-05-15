
Pod::Spec.new do |s|
  s.name         = "RNStringee"
  s.version      = "1.0.0"
  s.summary      = "RNStringee"
  s.description  = <<-DESC
                  The Stringee platform makes it easy to embed high-quality interactive video, voice, SMS into web and mobile apps.
                   DESC
  s.homepage     = "www.stringee.com"
  s.license      = "MIT"
  s.author       = { "Stringee" => "info@stringee.com" }
  s.platform     = :ios, "8.0"
  s.source       = { :git => "https://github.com/stringeecom/stringee-react-native.git", :tag => s.version.to_s }
  s.source_files  = "*.{h,m}"
  s.requires_arc = true

  s.dependency "React"
  s.dependency "Stringee"
end

  