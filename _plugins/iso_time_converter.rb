module Jekyll
  module IsoDurationConverter
    def convert_iso_to_swedish(iso_duration)
      match = iso_duration.match(/P(?<years>\d+Y)?(?<months>\d+M)?(?<weeks>\d+W)?(?<days>\d+D)?T?(?<hours>\d+H)?(?<minutes>\d+M)?(?<seconds>\d+S)?/)
      
      return '' if match.nil?
      result = ''
      if match[:years]
        years = match[:years].to_i
        result += "#{years} år "
      end
      if match[:months]
        months = match[:months].to_i
        result += "#{months} månader "
      end
      if match[:weeks]
        weeks = match[:weeks].to_i
        result += "#{weeks} veckor "
      end
      if match[:days]
        days = match[:days].to_i
        result += "#{days} dagar "
      end
      if match[:hours]
        hours = match[:hours].to_i
        result += "#{hours} timmar "
      end
      if match[:minutes]
        minutes = match[:minutes].to_i
        result += "#{minutes} minuter "
      end
      if match[:seconds]
        seconds = match[:seconds].to_i
        result += "#{seconds} sekunder "
      end
      result.strip
    end
  end
end
Liquid::Template.register_filter(Jekyll::IsoDurationConverter)
