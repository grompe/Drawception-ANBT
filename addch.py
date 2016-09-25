import re,subprocess

gitcommand = 'git log origin..master --format="- %s"'

news = subprocess.check_output(gitcommand)
if len(news)<2:
  print("Nothing new.")
  exit()

f = open("CHANGELOG.txt", "rb")
changelog = f.read()
f.close()

ver = re.match("(\d+)\.(\d+)\.(\d+)\.(\d+)", changelog)
l = list(ver.group(1, 2, 3, 4))
l[1] = int(l[1], 10) + 1
newver = "%s.%s.%s.%s" % tuple(l)

additions = newver + "\n" + news + "\n"

f = open("CHANGELOG.txt", "wb")
f.write(additions)
f.write(changelog)
f.close()

print(additions)
